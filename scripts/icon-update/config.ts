/**
 * Icon 更新配置
 */

import type { IconUpdateConfig, IconSize } from './types';

/** PNG 尺寸定义 */
export const PNG_SIZES: IconSize[] = [
  { width: 16, height: 16, name: '16x16' },
  { width: 32, height: 32, name: '32x32' },
  { width: 64, height: 64, name: '64x64' },
  { width: 128, height: 128, name: '128x128' },
  { width: 256, height: 256, name: '256x256' },
  { width: 512, height: 512, name: '512x512' },
];

/** ICO 尺寸定义 */
export const ICO_SIZES = [16, 32, 48, 256];

/** 默认配置 */
export const DEFAULT_CONFIG: IconUpdateConfig = {
  sourceHtml: 'logo-preview-v2.html',

  outputDirs: {
    web: 'apps/web/public',
    electron: 'apps/electron/assets',
    exports: '.assets/icons',
  },

  pngSizes: PNG_SIZES,

  upload: {
    enabled: true,
    provider: 'official',
    cdnUrl: 'https://img.wemd.app',
  },

  updateFiles: [
    {
      path: 'README.md',
      replacements: [
        {
          pattern: /https:\/\/img\.wemd\.app\/favicon[-\w]*\.png/g,
          replacement: (url: string) => url,
        },
        {
          pattern: /https:\/\/weimd\.gudong\.site\/favicon[-\w]*\.svg/g,
          replacement: (url: string) => url,
        },
      ],
    },
    {
      path: 'apps/web/src/store/editorStore.ts',
      replacements: [
        {
          pattern: /https:\/\/img\.wemd\.app\/favicon[-\w]*\.png/g,
          replacement: (url: string) => url,
        },
      ],
    },
    {
      path: 'apps/docs/src/.vuepress/config.ts',
      replacements: [
        {
          pattern: /https:\/\/weimd\.gudong\.site\/favicon[-\w]*\.svg/g,
          replacement: (url: string) => url,
        },
      ],
    },
  ],

  backup: {
    enabled: true,
    dir: '.backups/icon-update',
  },

  options: {
    dryRun: false,
    exportOnly: false,
    verbose: false,
  },
};

/** 从环境变量加载配置 */
export function loadConfig(): IconUpdateConfig {
  return {
    ...DEFAULT_CONFIG,
    upload: {
      ...DEFAULT_CONFIG.upload,
      provider: (process.env.ICON_UPLOAD_PROVIDER as any) || 'official',
      config: process.env.ICON_UPLOAD_CONFIG ? JSON.parse(process.env.ICON_UPLOAD_CONFIG) : undefined,
    },
    options: {
      ...DEFAULT_CONFIG.options,
      dryRun: process.env ICON_DRY_RUN === 'true',
    },
  };
}

/** SVG 选择器映射 */
export const SVG_SELECTORS: Record<string, string> = {
  // 主设计 - 第一个 svg
  main: '.design-card:first-child .logo-main svg',

  // App Icon - iOS
  'app-ios': '.app-icon-preview .app-icon-item:first-child svg',

  // App Icon - Android
  'app-android': '.app-icon-preview .app-icon-item:nth-child(2) svg',

  // 变体
  'variant-1': '.variant-item:nth-child(1) svg',
  'variant-2': '.variant-item:nth-child(2) svg',
  'variant-3': '.variant-item:nth-child(3) svg',
  'variant-4': '.variant-item:nth-child(4) svg',
  'variant-5': '.variant-item:nth-child(5) svg',
  'variant-6': '.variant-item:nth-child(6) svg',
};

/** Icon 变体定义 */
export const ICON_VARIANTS = [
  {
    name: 'dark',
    svgSource: { selector: '.logo-main svg' },
    outputPath: 'favicon-dark.svg',
  },
  {
    name: 'light',
    svgSource: { selector: '.logo-bg.light svg' },
    outputPath: 'favicon-light.svg',
  },
  {
    name: 'app-icon',
    svgSource: { selector: '.app-icon-preview .app-icon-item:first-child svg' },
    outputPath: null,  // 不导出 SVG，只导出 PNG
  },
];
