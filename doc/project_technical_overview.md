# WeiMD 项目技术概览

## 1. 项目简介

WeiMD (WeMD) 是一个专为微信公众号设计的 Markdown 编辑器。它允许用户使用 Markdown 编写文章，并将其转换为带有精美样式的 HTML，可以直接复制粘贴到微信公众平台后台。

主要特性包括：
- **实时预览**：所见即所得的编辑体验。
- **多主题支持**：内置多种主题，支持自定义 CSS 主题。
- **一键复制**：自动将样式内联（Inline Styles），完美适配微信编辑器。
- **外链转脚标**：自动将 Markdown 中的链接转换为文末脚标。
- **代码高亮**：支持多种编程语言的高亮显示。
- **数学公式**：支持 KaTeX/MathJax 公式渲染。

## 2. 架构设计

本项目采用 Monorepo 架构，使用 `pnpm` 和 `turbo` 进行包管理和构建流程编排。

### 目录结构

```text
/
├── apps/
│   ├── web/          # 主 Web 应用 (React + Vite)
│   ├── docs/         # 项目文档 (VuePress)
│   ├── electron/     # 桌面端外壳 (Electron)
│   ├── server/       # 后端服务 (NestJS, 处理图床/上传)
│   └── worker/       # 边缘计算服务 (Cloudflare Workers)
├── packages/
│   └── core/         # 核心逻辑包 (Markdown 解析, 主题处理)
├── templates/        # 主题 CSS 模板文件
└── doc/              # 技术文档
```

## 3. 技术栈

- **包管理**: pnpm Workspaces + Turborepo
- **前端框架**: React 18
- **构建工具**: Vite
- **状态管理**: Zustand
- **编辑器内核**: CodeMirror 6
- **Markdown 解析**: markdown-it 及其插件生态
- **样式处理**: Juice (CSS Inliner)
- **UI 组件**: 自定义组件 + Lucide Icons

## 4. 核心模块说明

### 4.1 @wemd/web (Web 应用)

这是用户交互的主要界面。
- **Editor**: 基于 CodeMirror 6，提供语法高亮、快捷键支持。
- **Preview**: 实时渲染 HTML，支持左右滚动同步。
- **Store**: 使用 Zustand 管理全局状态（主题、编辑器内容、设置）。
  - `themeStore.ts`: 管理主题选择、自定义主题 CRUD。
  - `editorStore.ts`: 管理 Markdown 内容。

### 4.2 @wemd/core (核心逻辑)

这是项目的核心引擎，独立于 UI 框架，可在不同端（Web, Electron, Worker）复用。
- **MarkdownParser.ts**: 配置 `markdown-it`，加载各种插件（如 `markdown-it-span` 用于标题装饰，`markdown-it-math` 用于公式）。
- **ThemeProcessor.ts**: 负责将 CSS 样式内联到 HTML 标签中 (`juice`)，并处理微信特有的格式要求。
- **Themes**: 内置主题的定义。

### 4.3 渲染流程

1. **输入**: 用户在 Editor 输入 Markdown。
2. **解析**: `MarkdownParser` 将 Markdown 转换为原始 HTML结构（带有特定的 class 和 id）。
3. **样式注入**: `ThemeProcessor` 接收 HTML 和当前选中的 Theme CSS。
4. **内联化**: 使用 `juice` 将 CSS 规则转换为 HTML 标签的 `style` 属性。
5. **输出**: 生成最终的 HTML，在 Preview 中展示，或复制到剪贴板。

## 5. 数据存储

- **本地存储**: 使用 `localStorage` 和 `IndexedDB` 存储用户的文档历史、自定义主题和设置。
- **图床**: 支持配置多种图床服务（OSS, S3, etc.）。

## 6. 开发与构建

- **启动开发环境**: `pnpm dev` (启动 web)
- **构建**: `pnpm build` (构建所有包)
- **Lint**: `pnpm lint`
