/**
 * Icon 更新任务队列 - 主入口
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TaskQueue } from './queue';
import { createAllTasks } from './tasks';
import { loadConfig } from './config';
import type { TaskContext, IconUpdateConfig } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Icon 更新器 */
export class IconUpdater {
  private context: TaskContext;
  private queue: TaskQueue;

  constructor(config: Partial<IconUpdateConfig> = {}) {
    // 合并配置
    const defaultConfig = loadConfig();
    const finalConfig: IconUpdateConfig = {
      ...defaultConfig,
      ...config,
      outputDirs: { ...defaultConfig.outputDirs, ...config.outputDirs },
      upload: { ...defaultConfig.upload, ...config.upload },
      options: { ...defaultConfig.options, ...config.options },
    };

    // 创建上下文
    const workspaceRoot = path.resolve(__dirname, '../../..');
    this.context = {
      workspaceRoot,
      config: finalConfig,
      sharedData: new Map(),
      backupFiles: new Map(),
    };

    // 创建任务队列
    this.queue = new TaskQueue(this.context);
    this.queue.on({
      onTaskStart: (task) => {
        console.log(`\n📋 ${task.name}`);
        if (task.description) {
          console.log(`   ${task.description}`);
        }
      },
      onTaskComplete: (task, result) => {
        if (result.success) {
          console.log(`   ✅ ${result.message || 'Completed'}`);
        } else {
          console.log(`   ❌ ${result.message || result.error?.message}`);
        }
      },
      onTaskError: (task, error) => {
        console.error(`   ❌ Error: ${error.message}`);
      },
      onProgress: (progress) => {
        const percent = Math.round(progress * 100);
        process.stdout.write(`\r   Progress: ${percent}%`);
      },
    });
  }

  /** 运行更新流程 */
  async run(): Promise<boolean> {
    console.log('🚀 Starting Icon Update...\n');

    // 添加所有任务
    const tasks = createAllTasks();
    this.queue.addAll(tasks);

    try {
      // 执行任务队列
      const results = await this.queue.run();

      // 显示统计
      const stats = this.queue.getStats();
      console.log('\n\n📊 Statistics:');
      console.log(`   Total: ${stats.total}`);
      console.log(`   Completed: ${stats.completed}`);
      console.log(`   Failed: ${stats.failed}`);
      console.log(`   Skipped: ${stats.skipped}`);

      // 检查是否有失败
      const hasFailures = stats.failed > 0;
      if (hasFailures) {
        console.log('\n⚠️  Some tasks failed. Rolling back...');
        await this.queue.rollback();
        return false;
      }

      console.log('\n✅ Icon update completed successfully!');
      return true;

    } catch (error) {
      console.error('\n❌ Fatal error:', error);
      await this.queue.rollback();
      return false;
    }
  }

  /** 预览将要执行的更改 */
  async preview(): Promise<void> {
    const { config } = this.context;

    console.log('🔍 Preview Mode\n');
    console.log('Configuration:');
    console.log(`  Source HTML: ${config.sourceHtml}`);
    console.log(`  Output dirs: ${JSON.stringify(config.outputDirs)}`);
    console.log(`  Upload: ${config.upload.enabled ? config.upload.provider : 'disabled'}`);
    console.log(`  Dry run: ${config.options.dryRun}`);
    console.log(`  Export only: ${config.options.exportOnly}\n`);

    console.log('Files to update:');
    for (const fileConfig of config.updateFiles) {
      console.log(`  - ${fileConfig.path}`);
    }
    console.log('');
  }
}

/** CLI 入口 */
export async function main(args: string[] = []): Promise<void> {
  const config: Partial<IconUpdateConfig> = {};

  // 解析命令行参数
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--dry-run':
        config.options = { ...config.options, dryRun: true };
        break;
      case '--export-only':
        config.options = { ...config.options, exportOnly: true };
        break;
      case '--verbose':
        config.options = { ...config.options, verbose: true };
        break;
      case '--no-upload':
        config.upload = { ...config.upload, enabled: false };
        break;
      case '--upload':
        config.upload = { ...config.upload, enabled: true, provider: args[++1] as any };
        break;
      case '--preview':
        config.options = { ...config.options, dryRun: true };
        break;
    }
  }

  const updater = new IconUpdater(config);

  if (args.includes('--preview')) {
    await updater.preview();
    return;
  }

  const success = await updater.run();
  process.exit(success ? 0 : 1);
}

// 当直接运行此文件时
if (import.meta.url === `file://${process.argv[1]}`) {
  await main(process.argv.slice(2));
}
