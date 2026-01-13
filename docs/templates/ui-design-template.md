# [功能名称] UI 设计

> **角色提示**：编写本文档时，请扮演 **UI/UX 设计师** 角色
> 详细角色说明请查看：[docs/templates/roles/02-designer.md](../docs/templates/roles/02-designer.md)

---

## 📋 元信息

| 项目 | 内容 |
|------|------|
| **关联 PRD** | FEAT-XXX |
| **编写日期** | YYYY-MM-DD |
| **当前状态** | 📝 草稿 / ✅ 已确认 |

---

## 🎨 设计稿

### 页面布局

```
┌─────────────────────────────────────┐
│                                     │
│     [放置 UI 设计稿]                │
│                                     │
└─────────────────────────────────────┘
```

### 交互说明

| 操作 | 反馈 |
|------|------|
| 点击 xxx | xxx 效果 |
| 悬停 xxx | xxx 效果 |

---

## 🧩 组件设计

### 使用现有组件

| 组件 | 位置 | 用途 |
|------|------|------|
| xxx | apps/web/src/components/ | 复用说明 |

### 需新增组件

```
components/FeatureName/
├── index.tsx
├── FeatureName.tsx
└── styles.css
```

---

## 🎨 样式规范

### 颜色使用

| 元素 | 颜色 | CSS 变量 |
|------|------|----------|
| 主按钮 | #07c160 | var(--ui-accent-primary) |
| 背景 | #ffffff | var(--ui-bg-primary) |

### 间距规范

| 元素 | 间距 | CSS 变量 |
|------|------|----------|
| 内边距 | 16px | var(--spacing-md) |
| 外边距 | 24px | var(--spacing-lg) |

### 动画规范

| 场景 | 动画 | 时长 |
|------|------|------|
| 淡入 | fade-in | 200ms |

---

## 🖼️ 图标使用

| 场景 | 图标 | 大小 |
|------|------|------|
| xxx | lucide-react/Xxx | 16px |

---

## 📱 响应式

| 断点 | 布局 |
|------|------|
| ≥768px | 完整布局 |
| <768px | 简化布局 |

---

## 🎭 状态设计

| 状态 | 视觉表现 |
|------|----------|
| 默认 | 正常显示 |
| 悬停 | 背景变化 |
| 加载 | Loading 图标 |
| 错误 | 错误提示 |
| 空状态 | 空状态插图 |

---

## 🌓 深色模式

| 类型 | 亮色 | 深色 |
|------|------|------|
| 背景 | #ffffff | #252526 |
| 文字 | #0f172a | #cccccc |

---

## 📄 HTML 原型

> **重要**：请输出 `prototype.html` 文件，可在浏览器直接预览

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[功能名称] 原型</title>
    <style>
        /* CSS 变量 */
        :root {
            --ui-accent-primary: #07c160;
            --ui-bg-page: #f8f9fa;
            --ui-bg-primary: #ffffff;
            --ui-text-primary: #0f172a;
            --ui-text-secondary: #64748b;
            --spacing-md: 16px;
            --radius-md: 12px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--ui-bg-page);
            color: var(--ui-text-primary);
            padding: var(--spacing-md);
        }

        /* 组件样式 */
        .component {
            background: var(--ui-bg-primary);
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        /* 交互说明 */
        .interaction-note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 16px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <!-- 组件原型 -->
    <div class="component">
        <h2>[功能名称] 原型</h2>
        <!-- 交互说明 -->
        <div class="interaction-note">
            💡 交互说明：点击按钮触发 xxx 效果
        </div>
    </div>
</body>
</html>
```

---

## 🔗 相关文档

- [PRD 文档](../01-product/prd.md)
- [UI 设计规范](../../../03-design/brand/colors.md)

---

## 📝 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|----------|------|
| YYYY-MM-DD | 1.0 | 初始版本 | @name |
