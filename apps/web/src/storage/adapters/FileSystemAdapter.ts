import type { StorageAdapter } from '../StorageAdapter';
import type { FileItem, StorageAdapterContext, StorageInitResult } from '../types';

export type DirectoryMode = 'flat' | 'folder';

export class FileSystemAdapter implements StorageAdapter {
  readonly type = 'filesystem' as const;
  readonly name = 'FileSystem Access';
  ready = false;
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private handleKey = 'fs-handle';
  private mode: DirectoryMode = 'flat';

  async init(context?: StorageAdapterContext): Promise<StorageInitResult> {
    if (!('showDirectoryPicker' in window)) {
      return { ready: false, message: 'File System Access API not supported' };
    }

    if (context?.identifier) {
      this.handleKey = `fs-handle-${context.identifier}`;
    }

    if (context?.identifier && !this.directoryHandle) {
      this.directoryHandle = await this.restoreHandle().catch(() => null);
    }

    if (!this.directoryHandle) {
      this.directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await this.persistHandle(this.directoryHandle);
    }

    const permission = await this.directoryHandle.requestPermission({ mode: 'readwrite' });
    this.ready = permission === 'granted';

    // 检测目录结构模式
    if (this.ready) {
      this.mode = await this.detectMode();
    }

    return { ready: this.ready, message: permission };
  }

  /**
   * 获取当前目录模式
   */
  getMode(): DirectoryMode {
    return this.mode;
  }

  /**
   * 检测目录结构模式
   * folder 模式: 子文件夹包含 article.md
   * flat 模式: 根目录直接包含 .md 文件
   */
  private async detectMode(): Promise<DirectoryMode> {
    const handle = this.ensureHandle();
    let hasArticleMdFolder = false;

    for await (const entry of handle.values()) {
      if (entry.kind === 'directory') {
        // 检查是否包含 article.md
        try {
          const dirHandle = entry as FileSystemDirectoryHandle;
          await dirHandle.getFileHandle('article.md');
          hasArticleMdFolder = true;
          break; // 找到一个就确定是 folder 模式
        } catch {
          // 不包含 article.md，继续检查
        }
      }
    }

    // 如果有文件夹含 article.md，优先使用 folder 模式
    return hasArticleMdFolder ? 'folder' : 'flat';
  }

  private async persistHandle(handle: FileSystemDirectoryHandle) {
    try {
      const db = await this.openHandleDb();
      const tx = db.transaction('handles', 'readwrite');
      await tx.store.put(handle, this.handleKey);
      await tx.done;
    } catch {
      /* ignore */
    }
  }

  private async restoreHandle(): Promise<FileSystemDirectoryHandle | null> {
    const db = await this.openHandleDb();
    const tx = db.transaction('handles', 'readonly');
    const handle = await tx.store.get(this.handleKey);
    await tx.done;
    return handle ?? null;
  }

  private async openHandleDb() {
    const { openDB } = await import('idb');
    return openDB('wemd-fs-handles', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles');
        }
      },
    });
  }

  private ensureHandle() {
    if (!this.directoryHandle) throw new Error('Directory handle not initialized');
    return this.directoryHandle;
  }

  /**
   * 获取文件元数据，读取文件头部提取 themeName
   */
  async listFiles(): Promise<FileItem[]> {
    const handle = this.ensureHandle();
    const result: FileItem[] = [];

    if (this.mode === 'folder') {
      // 文件夹模式: 遍历子文件夹，读取每个的 article.md
      for await (const entry of handle.values()) {
        if (entry.kind === 'directory') {
          try {
            const dirHandle = entry as FileSystemDirectoryHandle;
            const fileHandle = await dirHandle.getFileHandle('article.md');
            const file = await fileHandle.getFile();
            const themeName = await this.extractThemeName(file);

            result.push({
              path: `${entry.name}/article.md`,
              name: entry.name, // 使用文件夹名作为显示名称
              size: file.size,
              updatedAt: file.lastModified ? new Date(file.lastModified).toISOString() : undefined,
              meta: themeName ? { themeName, isFolder: true } : { isFolder: true },
            });
          } catch {
            // 文件夹没有 article.md，跳过
            continue;
          }
        }
      }
    } else {
      // 扁平模式: 根目录直接包含 .md 文件
      for await (const entry of handle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          const themeName = await this.extractThemeName(file);

          result.push({
            path: entry.name,
            name: entry.name,
            size: file.size,
            updatedAt: file.lastModified ? new Date(file.lastModified).toISOString() : undefined,
            meta: themeName ? { themeName, isFolder: false } : { isFolder: false },
          });
        }
      }
    }

    // 按编辑时间降序排序（最新的在前）
    result.sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });
    return result;
  }

  /**
   * 从文件内容中提取 themeName
   */
  private async extractThemeName(file: File): Promise<string | undefined> {
    try {
      const slice = file.slice(0, 500);
      const text = await slice.text();
      const match = text.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        const themeMatch = match[1].match(/themeName:\s*(.+)/);
        if (themeMatch) {
          return themeMatch[1].trim().replace(/^['"]|['"]$/g, '');
        }
      }
    } catch {
      // ignore
    }
    return undefined;
  }

  async readFile(path: string): Promise<string> {
    const fileHandle = await this.getFileHandleByPath(path);
    const file = await fileHandle.getFile();
    return file.text();
  }

  async writeFile(path: string, content: string): Promise<void> {
    const fileHandle = await this.getFileHandleByPath(path, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async deleteFile(path: string): Promise<void> {
    if (this.mode === 'folder' && path.includes('/')) {
      // 文件夹模式: 删除整个文件夹
      const folderName = path.split('/')[0];
      await this.ensureHandle().removeEntry(folderName, { recursive: true });
    } else {
      // 扁平模式: 只删除文件
      await this.ensureHandle().removeEntry(path);
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (oldPath === newPath) return;

    if (this.mode === 'folder') {
      // 文件夹模式: 重命名文件夹
      const oldFolderName = oldPath.split('/')[0];
      const newFolderName = newPath.split('/')[0];

      // 读取旧文件内容
      const content = await this.readFile(oldPath);

      // 创建新文件夹
      const newFolderHandle = await this.ensureHandle().getDirectoryHandle(newFolderName, { create: true });

      // 创建 images 目录
      await newFolderHandle.getDirectoryHandle('images', { create: true });

      // 写入新文件
      const newFileHandle = await newFolderHandle.getFileHandle('article.md', { create: true });
      const writable = await newFileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // 删除旧文件夹
      await this.ensureHandle().removeEntry(oldFolderName, { recursive: true });
    } else {
      // 扁平模式: 复制后删除
      const content = await this.readFile(oldPath);
      await this.writeFile(newPath, content);
      await this.deleteFile(oldPath);
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.getFileHandleByPath(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 创建新文章（文件夹模式）
   */
  async createArticle(title: string, content: string): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '-');
    const folderName = `${timestamp}-${title}`;

    if (this.mode === 'folder') {
      // 创建文件夹
      const folderHandle = await this.ensureHandle().getDirectoryHandle(folderName, { create: true });

      // 创建 images 目录
      await folderHandle.getDirectoryHandle('images', { create: true });

      // 创建 article.md
      const fileHandle = await folderHandle.getFileHandle('article.md', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      return `${folderName}/article.md`;
    } else {
      // 扁平模式: 直接创建 .md 文件
      const fileName = `${folderName}.md`;
      const fileHandle = await this.ensureHandle().getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      return fileName;
    }
  }

  /**
   * 根据路径获取文件句柄（支持带 / 的路径）
   */
  private async getFileHandleByPath(path: string, options?: { create: boolean }): Promise<FileSystemFileHandle> {
    const parts = path.split('/');
    const root = this.ensureHandle();

    if (parts.length === 1) {
      // 根目录下的文件
      return root.getFileHandle(parts[0], options);
    } else {
      // 子文件夹下的文件
      const dirHandle = await root.getDirectoryHandle(parts[0], options);
      return dirHandle.getFileHandle(parts[1], options);
    }
  }

  /**
   * 将扁平模式迁移到文件夹模式
   * 注意：这是一个破坏性操作，建议用户先备份
   */
  async migrateToFolderMode(): Promise<{ success: boolean; message: string }> {
    if (this.mode === 'folder') {
      return { success: true, message: '已经是文件夹模式，无需迁移' };
    }

    const handle = this.ensureHandle();
    const migrations: Array<{ oldPath: string; newPath: string }> = [];

    try {
      // 第一步：收集所有需要迁移的文件
      for await (const entry of handle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const oldPath = entry.name;
          // 移除 .md 后缀作为文件夹名
          const folderName = entry.name.replace(/\.md$/, '');
          const newPath = `${folderName}/article.md`;
          migrations.push({ oldPath, newPath });
        }
      }

      if (migrations.length === 0) {
        return { success: true, message: '没有需要迁移的文件' };
      }

      // 第二步：执行迁移
      for (const { oldPath, newPath } of migrations) {
        // 读取原文件内容
        const content = await this.readFile(oldPath);

        // 创建文件夹结构
        const folderName = newPath.split('/')[0];
        const folderHandle = await handle.getDirectoryHandle(folderName, { create: true });
        await folderHandle.getDirectoryHandle('images', { create: true });

        // 写入新文件
        const fileHandle = await folderHandle.getFileHandle('article.md', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        // 删除原文件
        await handle.removeEntry(oldPath);
      }

      // 更新模式
      this.mode = 'folder';

      return { success: true, message: `成功迁移 ${migrations.length} 个文件到文件夹模式` };
    } catch (error) {
      return { success: false, message: `迁移失败: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async teardown() {
    this.directoryHandle = null;
    this.ready = false;
  }
}
