# 架构概览

> WeMD 的技术架构说明

---

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户层                               │
│   Web 浏览器 │ Chrome 插件 │ Android App │ 桌面应用         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      前端层 (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 编辑器组件   │  │ 预览组件     │  │ 设置/主题/历史       │  │
│  │ CodeMirror  │  │ Markdown渲染 │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      状态管理 (Zustand)                       │
│  editorStore │ themeStore │ uiStore │ fileStore │ history   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      核心层 (@wemd/core)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 解析器       │  │ 主题处理器   │  │ 深色模式转换         │  │
│  │ markdown-it │  │ juice       │  │ wechatDarkMode      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      存储层                                   │
│  IndexedDB │ LocalStorage │ File System API │ 云端(可选)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 代码结构

### Monorepo 结构

```
WeMD/
├── apps/
│   ├── web/              # React Web 应用
│   ├── electron/         # Electron 桌面应用
│   ├── chrome-extension/ # Chrome 插件 (规划中)
│   ├── android/          # Android 应用 (规划中)
│   └── server/           # 图床上传服务
├── packages/
│   └── core/             # 共享核心包
├── templates/            # 主题 CSS 源文件
└── scripts/              # 构建脚本
```

### Web 应用结构

```
apps/web/src/
├── components/           # React 组件
│   ├── Editor/          # 编辑器组件
│   ├── Preview/         # 预览组件
│   ├── Sidebar/         # 侧边栏
│   ├── Theme/           # 主题面板
│   └── Settings/        # 设置面板
├── store/               # Zustand 状态管理
│   ├── editorStore.ts
│   ├── themeStore.ts
│   ├── uiStore.ts
│   ├── fileStore.ts
│   └── historyStore.ts
├── storage/             # 存储适配器
│   ├── IndexedDBAdapter.ts
│   └── FileSystemAdapter.ts
├── services/            # 业务服务
│   └── wechatCopyService.ts
└── hooks/               # 自定义 Hooks
```

---

## 🔧 核心模块

### 1. Markdown 解析器

**位置**: `packages/core/src/MarkdownParser.ts`

- 基于 `markdown-it`
- 扩展插件：数学公式、图组滑动、警告框
- CJK 文本强调标记补丁

### 2. 主题处理器

**位置**: `packages/core/src/ThemeProcessor.ts`

- 使用 `juice` 内联 CSS
- 添加 `data-tool` 属性
- 包装 `#wemd` 容器

### 3. 深色模式转换

**位置**: `packages/core/src/wechatDarkMode.ts`

- 基于微信官方算法
- HSL 色彩空间计算
- 98%+ 还原度

---

## 🔄 数据流

### 编辑流程

```
用户输入 → CodeMirror 更新
    ↓
editorStore 更新
    ↓
MarkdownParser 解析
    ↓
ThemeProcessor 处理样式
    ↓
Preview 组件渲染
```

### 复制到微信流程

```
点击复制 → wechatCopyService
    ↓
获取当前 Markdown
    ↓
解析 + 主题处理
    ↓
生成 HTML (内联样式)
    ↓
写入剪贴板 (text/html)
```

---

## 🗄️ 存储策略

### 本地存储 (默认)

| 类型 | 用途 | 容量 |
|------|------|------|
| IndexedDB | 文档内容 | 大容量 |
| LocalStorage | 用户设置 | 5MB |

### 文件系统访问

- 使用 File System Access API
- 用户授权后直接读写本地文件
- 更适合长期存储

---

## 🚀 部署架构

```
┌─────────────────┐
│   CDN / 静态托管  │  ← Web 前端
└─────────────────┘

┌─────────────────┐
│  Cloudflare R2  │  ← 图片存储
└─────────────────┘

┌─────────────────┐
│ Cloudflare Worker│ ← 图片上传服务
└─────────────────┘
```

---

## 📝 变更记录

| 日期 | 变更内容 |
|------|----------|
| 2024-01-13 | 初始版本 |
