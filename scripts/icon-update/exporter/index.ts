/**
 * Icon 导出器 - 从 HTML 提取 SVG
 */

import type { TaskContext } from '../types';
import { ICON_VARIANTS } from '../config';

/** SVG 元素选择器 */
function selectSVG(html: string, selector: string): string | null {
  // 简单的 HTML 解析，找到匹配选择器的 SVG
  // 注意：这是简化版本，实际应该用专业的 HTML 解析器

  // 移除换行和多余空格
  const cleanHtml = html.replace(/\s+/g, ' ').trim();

  // 查找 SVG 标签
  const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
  const matches = cleanHtml.match(svgRegex);

  if (!matches) return null;

  // 根据选择器返回对应的 SVG
  // 这里简化处理：假设选择器对应特定的 SVG 位置
  if (selector.includes('logo-main')) {
    return matches[0] || null;
  }
  if (selector.includes('light')) {
    return matches[1] || null;
  }
  if (selector.includes('app-icon')) {
    return matches.find(m => m.includes('rect') && m.includes('07C160')) || null;
  }

  return matches[0] || null;
}

/** 生成深色变体 SVG */
function generateDarkSVG(svg: string): string {
  return svg
    .replace(/fill="white"/gi, 'fill="#e2e8f0"')
    .replace(/fill="#e2e8f0"/gi, 'fill="#0F172A"')
    .replace(/stroke="white"/gi, 'stroke="#e2e8f0"')
    .replace(/stroke="#e2e8f0"/gi, 'stroke="#0F172A"');
}

/** 生成浅色变体 SVG */
function generateLightSVG(svg: string): string {
  // 保持原样
  return svg;
}

/** 清理 SVG 属性 */
function cleanSVG(svg: string): string {
  return svg
    .replace(/ width="[^"]*"/, '')
    .replace(/ height="[^"]*"/, '')
    .replace(/ class="[^"]*"/g, '')
    .replace(/ style="[^"]*"/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
}

/** 导出 SVG 图标 */
export async function exportIcons(html: string, context: TaskContext): Promise<Array<{ path: string; content: string }>> {
  const exported: Array<{ path: string; content: string }> = [];

  // 找到主 SVG
  const mainSVG = selectSVG(html, '.logo-main svg');
  if (!mainSVG) {
    throw new Error('Could not find main SVG in HTML');
  }

  const cleanMainSVG = cleanSVG(mainSVG);

  // 导出深色版本
  const darkSVG = generateDarkSVG(cleanMainSVG);
  exported.push({
    path: 'favicon-dark.svg',
    content: darkSVG,
  });

  // 导出浅色版本
  const lightSVG = generateLightSVG(cleanMainSVG);
  exported.push({
    path: 'favicon-light.svg',
    content: lightSVG,
  });

  // 导出 App Icon SVG（实心块面风格）
  const appIconSVG = generateAppIconSVG();
  exported.push({
    path: 'app-icon.svg',
    content: appIconSVG,
  });

  return exported;
}

/** 生成 App Icon SVG（实心块面风格） */
function generateAppIconSVG(): string {
  return `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="180" height="180" rx="44" fill="#07C160"/>
  <!-- W 字母 -->
  <path d="M40 50 L60 110 L75 85 L90 110 L110 50" stroke="white" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- M 字母 -->
  <path d="M110 50 L110 110 L125 85 L140 110 L140 50" stroke="white" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- 底部横条 -->
  <rect x="40" y="140" width="120" height="10" rx="5" fill="white"/>
</svg>`;
}
