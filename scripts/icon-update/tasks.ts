/**
 * 任务定义
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Task, TaskContext, TaskResult } from './types';
import { exportIcons } from './exporter';
import { convertPNG } from './exporter/png';
import { uploadIcons } from './uploader';
import { updateReferences } from './updater';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 任务 1: 导出 SVG */
export const ExportSVGTask: Task = {
  id: 'export-svg',
  name: 'Export SVG Icons',
  description: '从 logo-preview.html 提取并导出 SVG 图标',
  async execute(context: TaskContext): Promise<TaskResult> {
    const { config } = context;
    const htmlPath = path.join(context.workspaceRoot, config.sourceHtml);

    try {
      await fs.access(htmlPath);
    } catch {
      return {
        success: false,
        error: new Error(`Source HTML not found: ${htmlPath}`),
      };
    }

    const html = await fs.readFile(htmlPath, 'utf-8');

    // 导出 SVG
    const exported = await exportIcons(html, context);

    // 保存到共享数据
    context.sharedData.set('exported-svg', exported);

    return {
      success: true,
      data: exported,
      message: `Exported ${exported.length} SVG icons`,
    };
  },
};

/** 任务 2: 转换 PNG */
export const ConvertPNGTask: Task = {
  id: 'convert-png',
  name: 'Convert to PNG',
  description: '将 SVG 转换为多种尺寸的 PNG',
  dependencies: ['export-svg'],
  async execute(context: TaskContext): Promise<TaskResult> {
    const { config } = context;

    // 获取 app icon SVG
    const exported = context.sharedData.get('exported-svg') as Array<{ path: string; content: string }>;
    const appIconSvg = exported.find(e => e.path.includes('app-icon'));

    if (!appIconSvg) {
      return {
        success: false,
        error: new Error('App icon SVG not found'),
      };
    }

    const sizes = config.pngSizes;
    const pngFiles: Array<{ size: string; path: string }> = [];

    // 转换各个尺寸
    for (const size of sizes) {
      const pngPath = path.join(context.workspaceRoot, config.outputDirs.exports, `icon-${size.name}.png`);
      await convertPNG(appIconSvg.content, size.width, size.height, pngPath);
      pngFiles.push({ size: size.name, path: pngPath });
    }

    // 保存最大的 PNG 供 Electron 使用
    const largestSize = sizes[sizes.length - 1];
    const electronIconPath = path.join(context.workspaceRoot, config.outputDirs.electron, 'icon.png');
    await convertPNG(appIconSvg.content, largestSize.width, largestSize.height, electronIconPath);

    context.sharedData.set('png-files', pngFiles);

    return {
      success: true,
      data: pngFiles,
      message: `Converted ${pngFiles.length} PNG files`,
    };
  },
};

/** 任务 3: 复制到 Web 目录 */
export const CopyWebIconsTask: Task = {
  id: 'copy-web-icons',
  name: 'Copy Icons to Web',
  description: '复制图标到 web 公共目录',
  dependencies: ['export-svg'],
  async execute(context: TaskContext): Promise<TaskResult> {
    const { config } = context;
    const exported = context.sharedData.get('exported-svg') as Array<{ path: string; content: string }>;

    const webDir = path.join(context.workspaceRoot, config.outputDirs.web);
    const copied: string[] = [];

    for (const icon of exported) {
      if (icon.path.endsWith('.svg')) {
        const targetPath = path.join(webDir, path.basename(icon.path));
        await fs.writeFile(targetPath, icon.content, 'utf-8');
        copied.push(targetPath);
      }
    }

    // 复制 PNG favicon
    const pngFiles = context.sharedData.get('png-files') as Array<{ size: string; path: string }>;
    const favicon64Png = pngFiles.find(f => f.size === '64x64');
    if (favicon64Png) {
      const targetPath = path.join(webDir, 'favicon-dark.png');
      await fs.copyFile(favicon64Png.path, targetPath);
      copied.push(targetPath);
    }

    return {
      success: true,
      data: copied,
      message: `Copied ${copied.length} files to web directory`,
    };
  },
};

/** 任务 4: 上传到图床 */
export const UploadIconsTask: Task = {
  id: 'upload-icons',
  name: 'Upload Icons',
  description: '上传图标到图床',
  dependencies: ['export-svg', 'convert-png'],
  async execute(context: TaskContext): Promise<TaskResult> {
    const { config } = context;

    if (!config.upload.enabled || config.options.exportOnly) {
      return {
        success: true,
        message: 'Upload skipped (disabled or export-only mode)',
      };
    }

    const uploaded = await uploadIcons(context);

    context.sharedData.set('uploaded-icons', uploaded);

    return {
      success: true,
      data: uploaded,
      message: `Uploaded ${uploaded.length} icons`,
    };
  },
};

/** 任务 5: 更新引用 */
export const UpdateReferencesTask: Task = {
  id: 'update-references',
  name: 'Update References',
  description: '更新项目中的图标引用地址',
  dependencies: ['upload-icons'],
  async execute(context: TaskContext): Promise<TaskResult> {
    const { config } = context;

    if (config.options.dryRun) {
      return {
        success: true,
        message: 'Update skipped (dry-run mode)',
      };
    }

    const updated = await updateReferences(context);

    return {
      success: true,
      data: updated,
      message: `Updated ${updated.filter(u => u.updated).length} files`,
    };
  },
};

/** 创建备份任务 */
export const CreateBackupTask: Task = {
  id: 'create-backup',
  name: 'Create Backup',
  description: '创建备份',
  async execute(context: TaskContext): Promise<TaskResult> {
    const { config, backupFiles } = context;

    if (!config.backup.enabled) {
      return {
        success: true,
        message: 'Backup skipped (disabled)',
      };
    }

    const backupDir = path.join(context.workspaceRoot, config.backup.dir);
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.json`);

    // 保存需要备份的文件内容
    const backupData: Record<string, string> = {};

    for (const fileConfig of config.updateFiles) {
      const filePath = path.join(context.workspaceRoot, fileConfig.path);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        backupData[fileConfig.path] = content;
        backupFiles.set(fileConfig.path, content);
      } catch {
        // 文件不存在，跳过
      }
    }

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');

    return {
      success: true,
      data: { backupPath, files: Object.keys(backupData) },
      message: `Backup created at ${backupPath}`,
    };
  },
};

/** 回滚任务 */
export const RollbackTask: Task = {
  id: 'rollback',
  name: 'Rollback Changes',
  description: '回滚所有更改',
  dependencies: ['create-backup'],
  async execute(context: TaskContext): Promise<TaskResult> {
    const { backupFiles } = context;

    if (backupFiles.size === 0) {
      return {
        success: true,
        message: 'Nothing to rollback',
      };
    }

    for (const [filePath, content] of backupFiles.entries()) {
      await fs.writeFile(filePath, content, 'utf-8');
    }

    return {
      success: true,
      message: `Rolled back ${backupFiles.size} files`,
    };
  },
};

/** 创建所有任务 */
export function createAllTasks(): Task[] {
  return [
    CreateBackupTask,
    ExportSVGTask,
    ConvertPNGTask,
    CopyWebIconsTask,
    UploadIconsTask,
    UpdateReferencesTask,
  ];
}
