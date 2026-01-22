/**
 * 引用更新器 - 更新项目中的图标引用地址
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { TaskContext, UpdateResult } from './types';

/** 更新文件中的图标引用 */
export async function updateReferences(context: TaskContext): Promise<UpdateResult[]> {
  const { config, sharedData } = context;
  const results: UpdateResult[] = [];

  // 获取上传后的 URL 映射
  const uploaded = sharedData.get('uploaded-icons') as Array<{ localPath: string; remoteUrl: string }>;
  const urlMap = new Map(uploaded.map(u => [u.localPath, u.remoteUrl]));

  for (const fileConfig of config.updateFiles) {
    const filePath = path.join(context.workspaceRoot, fileConfig.path);

    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let updated = false;
      let fileResults: UpdateResult[] = [];

      for (const replacement of fileConfig.replacements) {
        const matches = content.matchAll(replacement.pattern);

        for (const match of matches) {
          const oldUrl = match[0];
          let newUrl: string;

          if (typeof replacement.replacement === 'function') {
            newUrl = replacement.replacement(oldUrl);
          } else {
            newUrl = replacement.replacement;
          }

          // 如果 URL 映射中有对应的远程地址，使用它
          const filename = path.basename(new URL(oldUrl).pathname);
          if (urlMap.has(filename)) {
            newUrl = urlMap.get(filename)!;
          }

          if (oldUrl !== newUrl) {
            content = content.replace(oldUrl, newUrl);
            updated = true;
            fileResults.push({
              file: fileConfig.path,
              oldUrl,
              newUrl,
              updated: true,
            });
          }
        }
      }

      if (updated && !config.options.dryRun) {
        await fs.writeFile(filePath, content, 'utf-8');
      }

      results.push(...fileResults);

    } catch (error) {
      console.error(`Failed to update ${fileConfig.path}:`, error);
      results.push({
        file: fileConfig.path,
        oldUrl: '',
        newUrl: '',
        updated: false,
      });
    }
  }

  return results;
}

/** 预览将要更新的内容 */
export async function previewUpdates(context: TaskContext): Promise<UpdateResult[]> {
  const originalOptions = context.config.options.dryRun;
  context.config.options.dryRun = true;

  const results = await updateReferences(context);

  context.config.options.dryRun = originalOptions;
  return results;
}
