/**
 * PNG 转换器
 *
 * 使用 sharp 或 puppeteer 进行 SVG 到 PNG 的转换
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/** 转换 SVG 为 PNG */
export async function convertPNG(
  svgContent: string,
  width: number,
  height: number,
  outputPath: string
): Promise<void> {
  // 确保 output 目录存在
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // 方案 1: 使用 sharp（推荐，需要安装）
  try {
    const sharp = await import('sharp');
    const svgBuffer = Buffer.from(svgContent, 'utf-8');

    await sharp(svgBuffer)
      .resize(width, height)
      .png()
      .toFile(outputPath);

    return;
  } catch {
    // sharp 不可用，尝试其他方案
  }

  // 方案 2: 使用 puppeteer（浏览器渲染）
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><style>body { margin: 0; padding: 0; }</style></head>
        <body>${svgContent}</body>
      </html>
    `);

    await page.screenshot({
      path: outputPath,
      clip: { x: 0, y: 0, width, height },
    });

    await browser.close();
    return;
  } catch {
    // puppeteer 不可用，尝试其他方案
  }

  // 方案 3: 使用 canvas（Node.js 环境）
  try {
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // 将 SVG 转为 data URL
    const svgBase64 = Buffer.from(svgContent, 'utf-8').toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        const pngBuffer = canvas.toBuffer('image/png');
        fs.writeFile(outputPath, pngBuffer).then(resolve).catch(reject);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });

    return;
  } catch {
    // canvas 不可用
  }

  throw new Error('No PNG conversion tool available. Please install sharp, puppeteer, or canvas.');
}
