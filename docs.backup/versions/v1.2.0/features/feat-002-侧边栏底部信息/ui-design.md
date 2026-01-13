# 侧边栏底部信息 UI 设计

## 📋 元信息

| 项目 | 内容 |
|------|------|
| **关联 PRD** | FEAT-002 |
| **编写日期** | 2024-01-13 |
| **当前状态** | 📝 草稿 |

---

## 🎨 设计稿

### 底部信息区域 (亮色模式)

```
┌─────────────────────────────────────┐
│  文件列表（滚动区域）                │
│  ...                                │
├─────────────────────────────────────┤
│ ────────────────────────────────── │  ← 分割线
│                                     │
│   📱 WeMD                           │
│   v1.2.0                            │
│   Markdown 写作，一键到公众号       │
│                                     │
│   [🌐 官网] [💻 GitHub] [ℹ️ 关于]   │
│                                     │
└─────────────────────────────────────┘
```

### 底部信息区域 (深色模式)

```
┌─────────────────────────────────────┐
│  文件列表（滚动区域）                │
│  ...                                │
├─────────────────────────────────────┤
│ ────────────────────────────────── │  ← 分割线（深色）
│                                     │
│   📱 WeMD                           │
│   v1.2.0                            │
│   Markdown 写作，一键到公众号       │
│                                     │
│   [🌐 官网] [💻 GitHub] [ℹ️ 关于]   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 样式规范

### 整体布局

| 属性 | 值 | 说明 |
|------|---|------|
| 位置 | 侧边栏底部 | 固定定位 |
| 高度 | auto | 自适应内容 |
| 内边距 | 16px (var(--spacing-md)) | 四周留白 |
| 上边框 | 1px solid var(--ui-border-color) | 分割线 |

### 文字样式

| 元素 | 大小 | 颜色 | 字重 |
|------|------|------|------|
| 项目名称 | 14px | var(--ui-text-primary) | 600 |
| 版本号 | 12px | var(--ui-text-tertiary) | 400 |
| Slogan | 12px | var(--ui-text-secondary) | 400 |
| 链接文字 | 13px | var(--ui-text-secondary) | 400 |

### 按钮样式

| 状态 | 背景色 | 文字色 | 边框 |
|------|--------|--------|------|
| 默认 | transparent | var(--ui-text-secondary) | none |
| 悬停 | var(--ui-bg-hover) | var(--ui-accent-primary) | none |

---

## 🧩 组件设计

### 组件结构

```
components/Sidebar/FileSidebar/
├── FileSidebar.tsx          # 主组件（修改）
├── FileSidebar.css          # 样式（修改）
└── SidebarFooter/           # 新增底部组件
    ├── index.tsx
    ├── SidebarFooter.tsx    # 底部信息组件
    ├── AboutModal.tsx       # 关于弹窗
    └── styles.css
```

### SidebarFooter 组件接口

```typescript
interface SidebarFooterProps {
  version: string;           // 版本号
  appName?: string;          // 应用名称，默认 "WeMD"
  slogan?: string;           // Slogan
  websiteUrl?: string;       // 官网链接
  githubUrl?: string;        // GitHub 链接
}

export function SidebarFooter({
  version,
  appName = 'WeMD',
  slogan = 'Markdown 写作，一键到公众号',
  websiteUrl = 'https://weimd.gudong.site/',
  githubUrl = 'https://github.com/tenngoxars/WeMD',
}: SidebarFooterProps): JSX.Element;
```

### AboutModal 组件接口

```typescript
interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

export function AboutModal({ isOpen, onClose, version }: AboutModalProps): JSX.Element;
```

---

## 🖼️ 图标使用

使用 `lucide-react` 图标库：

| 场景 | 图标 | 大小 |
|------|------|------|
| 应用 Logo | Smartphone / Laptop | 16px |
| 官网链接 | Globe | 14px |
| GitHub 链接 | Github | 14px |
| 关于按钮 | Info | 14px |
| 关闭弹窗 | X | 18px |

---

## 🎭 弹窗设计

### 关于弹窗

```
┌─────────────────────────────────────┐
│                      ┌───────────┐  │
│  关于 WeMD          │     X     │  │
├─────────────────────────────────────┤
│                                     │
│         ┌─────────────────┐         │
│         │                 │         │
│         │   [WeMD Logo]   │         │
│         │                 │         │
│         └─────────────────┘         │
│                                     │
│            WeMD                     │
│      v1.2.0                        │
│                                     │
│   Markdown 写作，一键到公众号       │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  WeMD 是专为微信公众号设计的        │
│  Markdown 编辑器，本地优先，        │
│  让创作更自由。                     │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  [🌐 官网]  [💻 GitHub]  [📚 文档]  │
│                                     │
└─────────────────────────────────────┘
```

### 弹窗样式

| 属性 | 值 |
|------|---|
| 宽度 | 400px |
| 圆角 | var(--ui-radius-lg) 16px |
| 阴影 | var(--ui-shadow-xl) |
| 内边距 | 24px |

---

## 📱 响应式

### 桌面端 (≥768px)
- 完整显示底部信息
- 链接横向排列

### 移动端 (<768px)
- 底部信息简化显示
- 仅显示版本号和关于按钮

---

## 🎭 状态设计

### 链接状态

| 状态 | 样式 |
|------|------|
| 默认 | 灰色文字 |
| 悬停 | 微信绿色文字 + 轻微背景 |
| 激活 | 微信绿色文字 |

### 弹窗状态

| 状态 | 动画 |
|------|------|
| 打开 | fade-in + scale-in (200ms) |
| 关闭 | fade-out + scale-out (150ms) |

---

## 🎨 CSS 代码示例

```css
/* 底部信息区域 */
.fs-footer {
  border-top: 1px solid var(--ui-border-color);
  padding: var(--spacing-md);
  background: var(--ui-bg-primary);
}

.fs-footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.fs-footer-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-text-primary);
}

.fs-footer-version {
  font-size: 12px;
  color: var(--ui-text-tertiary);
  margin-bottom: 8px;
}

.fs-footer-slogan {
  font-size: 12px;
  color: var(--ui-text-secondary);
  margin-bottom: 12px;
  line-height: 1.4;
}

.fs-footer-links {
  display: flex;
  gap: 12px;
}

.fs-footer-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--ui-text-secondary);
  text-decoration: none;
  padding: 6px 10px;
  border-radius: var(--ui-radius-sm);
  transition: all 0.15s ease;
}

.fs-footer-link:hover {
  background: var(--ui-bg-hover);
  color: var(--ui-accent-primary);
}
```

---

## 📝 备注

- 版本号应从 `package.json` 动态读取
- 链接配置应便于后续修改
- 弹窗使用 createPortal 避免层级问题
- 深色模式通过 CSS 变量自动适配

---

## 🔗 相关文档

- [PRD 文档](./prd.md)
- [UI 设计规范](../../standards/ui-design-guide.md)
- [现有侧边栏样式](../../../../../apps/web/src/components/Sidebar/FileSidebar.css)
