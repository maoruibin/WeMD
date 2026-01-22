/**
 * 图床上传器
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import FormData from 'form-data';
import type { TaskContext, UploadResult } from './types';

/** 图床上传 */
export async function uploadIcons(context: TaskContext): Promise<UploadResult[]> {
  const { config, sharedData } = context;
  const results: UploadResult[] = [];

  const exported = sharedData.get('exported-svg') as Array<{ path: string; content: string }>;
  const pngFiles = sharedData.get('png-files') as Array<{ size: string; path: string }>;

  // 上传 SVG
  for (const icon of exported) {
    if (icon.path.endsWith('.svg')) {
      const result = await uploadFile(
        Buffer.from(icon.content, 'utf-8'),
        icon.path,
        'image/svg+xml',
        config
      );
      if (result) {
        results.push(result);
      }
    }
  }

  // 上传 PNG
  if (pngFiles) {
    // 上传 64x64 作为主要 favicon
    const faviconPng = pngFiles.find(f => f.size === '64x64');
    if (faviconPng) {
      const buffer = await fs.readFile(faviconPng.path);
      const result = await uploadFile(buffer, 'favicon-dark.png', 'image/png', config);
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
}

/** 上传单个文件 */
async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  context: TaskContext
): Promise<UploadResult | null> {
  const { config } = context;

  try {
    switch (config.upload.provider) {
      case 'official': {
        return await uploadToOfficial(buffer, filename, mimeType, context);
      }
      case 'qiniu': {
        return await uploadToQiniu(buffer, filename, mimeType, context);
      }
      case 'aliyun': {
        return await uploadToAliyun(buffer, filename, mimeType, context);
      }
      default:
        throw new Error(`Unsupported upload provider: ${config.upload.provider}`);
    }
  } catch (error) {
    console.error(`Failed to upload ${filename}:`, error);
    return null;
  }
}

/** 上传到官方图床 */
async function uploadToOfficial(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  context: TaskContext
): Promise<UploadResult> {
  const { config } = context;

  const formData = new FormData();
  formData.append('file', buffer, { filename, contentType: mimeType });

  const response = await fetch('https://img.wemd.app/api/upload', {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  const remoteUrl = data.url || `${config.upload.cdnUrl}/${filename}`;

  return {
    localPath: filename,
    remoteUrl,
    size: buffer.length,
  };
}

/** 上传到七牛云 */
async function uploadToQiniu(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  context: TaskContext
): Promise<UploadResult> {
  const { config } = context;
  const qiniuConfig = config.upload.config as QiniuConfig;

  const formData = new FormData();
  formData.append('file', buffer, { filename, contentType: mimeType });
  formData.append('key', `icons/${filename}`);
  formData.append('token', await getQiniuToken(qiniuConfig));

  const response = await fetch(`https://upload.qiniup.com`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Qiniu upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  const remoteUrl = `${qiniuConfig.domain || config.upload.cdnUrl}/${data.key}`;

  return {
    localPath: filename,
    remoteUrl,
    size: buffer.length,
  };
}

/** 上传到阿里云 OSS */
async function uploadToAliyun(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  context: TaskContext
): Promise<UploadResult> {
  const { config } = context;
  const aliyunConfig = config.upload.config as AliyunConfig;

  // 使用 OSS SDK 或直接调用 API
  // 这里简化处理，使用 PUT 请求
  const objectKey = `icons/${Date.now()}-${filename}`;
  const url = `https://${aliyunConfig.bucket}.${aliyunConfig.region}.aliyuncs.com/${objectKey}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'Authorization': await generateAliyunSignature('PUT', objectKey, aliyunConfig),
    },
    body: buffer,
  });

  if (!response.ok) {
    throw new Error(`Aliyun upload failed: ${response.statusText}`);
  }

  return {
    localPath: filename,
    remoteUrl: url,
    size: buffer.length,
  };
}

/** 获取七牛上传 token */
async function getQiniuToken(config: QiniuConfig): Promise<string> {
  // 简化实现，实际应该服务端生成
  return config.uploadToken || '';
}

/** 生成阿里云签名 */
async function generateAliyunSignature(method: string, key: string, config: AliyunConfig): Promise<string> {
  // 简化实现
  return `OSS ${config.accessKeyId}:${config.accessKeySecret}`;
}

interface QiniuConfig {
  uploadToken?: string;
  domain?: string;
}

interface AliyunConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
}
