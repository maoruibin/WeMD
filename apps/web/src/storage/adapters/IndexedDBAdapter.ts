import type { StorageAdapter } from '../StorageAdapter';
import type { FileItem, StorageInitResult } from '../types';

const DB_NAME = 'wemd-files';
const STORE_NAME = 'files';

interface IndexedFileRecord {
  path: string;
  content: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export class IndexedDBAdapter implements StorageAdapter {
  readonly type = 'indexeddb' as const;
  readonly name = 'IndexedDB';
  ready = false;
  private db: IDBDatabase | null = null;

  async init(): Promise<StorageInitResult> {
    this.db = await this.openDb();
    this.ready = true;
    return { ready: true, message: 'IndexedDB ready' };
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        }
      };
    });
  }

  private getStore(mode: IDBTransactionMode) {
    if (!this.db) throw new Error('IndexedDB not initialized');
    return this.db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  }

  async listFiles(): Promise<FileItem[]> {
    const store = this.getStore('readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const files: FileItem[] = (request.result as IndexedFileRecord[]).map((item) => ({
          path: item.path,
          name: item.path.split('/').pop() ?? item.path,
          updatedAt: item.updatedAt,
          meta: item.meta,
        }));
        resolve(files);
      };
    });
  }

  async readFile(path: string): Promise<string> {
    const store = this.getStore('readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(path);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const record = request.result as IndexedFileRecord | undefined;
        if (!record) reject(new Error('File not found'));
        else resolve(record.content);
      };
    });
  }

  async writeFile(path: string, content: string): Promise<void> {
    const store = this.getStore('readwrite');
    const record: IndexedFileRecord = {
      path,
      content,
      updatedAt: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteFile(path: string): Promise<void> {
    const store = this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(path);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const content = await this.readFile(oldPath);
    await this.writeFile(newPath, content);
    await this.deleteFile(oldPath);
  }

  async exists(path: string): Promise<boolean> {
    const store = this.getStore('readonly');
    return new Promise((resolve, reject) => {
      const request = store.getKey(path);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(!!request.result);
    });
  }

  async teardown() {
    this.db?.close();
    this.db = null;
    this.ready = false;
  }
}
