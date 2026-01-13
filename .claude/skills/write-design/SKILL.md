---
name: write-design
description: 编写 UI 设计文档和 HTML 原型。扮演 UI/UX 设计师角色，根据 PRD 编写设计文档，并输出可交互的 HTML 原型文件。会读取角色提示词 templates/roles/02-designer.md、设计规范 docs/03-design/brand/colors.md 和现有组件 apps/web/src/components/，确保设计符合项目规范。
---

# 编写 UI 设计

扮演 UI/UX 设计师角色，编写设计文档并输出 HTML 原型。

## 触发方式

```
/write-design feat-002
/write-design 图片拖拽上传
```

## 执行步骤

### 1. 确定目标功能

定位到功能目录，确认 PRD 是否存在。

如果 PRD 不存在，提示：
```
⚠️ 未找到 PRD 文档
请先使用 /write-prd 编写产品需求文档
```

### 2. 加载上下文

读取以下文件：

```
templates/roles/02-designer.md         # 角色提示词
docs/03-design/brand/colors.md         # 色彩规范
docs/03-design/brand/voice.md          # 品牌语调
features/{功能目录}/01-product/prd.md  # PRD 文档
```

探索现有组件：
```
apps/web/src/components/
```

### 3. 编写设计文档

扮演 UI 设计师，编写 `ui-design.md`，包含：

- 📋 元信息
- 🎨 设计稿（ASCII 图或描述）
- 🧩 组件设计（复用现有/新增）
- 🎨 样式规范（颜色、间距、动画）
- 🖼️ 图标使用
- 📱 响应式
- 🎭 状态设计
- 🌓 深色模式

### 4. 输出 HTML 原型

创建可交互的 HTML 原型文件 `prototype.html`：

- 单文件 HTML（内联 CSS）
- 包含 CSS 变量（复用项目色彩）
- 可在浏览器直接预览
- 添加交互说明（黄色注释框）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{功能名称} 原型</title>
    <style>
        /* CSS 变量 - 复用项目色彩 */
        :root {
            --ui-accent-primary: #07c160;
            --ui-bg-page: #f8f9fa;
            --ui-bg-primary: #ffffff;
            --ui-text-primary: #0f172a;
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
    <div class="component">
        <h2>{功能名称} 原型</h2>
        <!-- 交互说明 -->
        <div class="interaction-note">
            💡 交互说明：点击按钮触发 xxx 效果
        </div>
        <!-- 原型内容 -->
    </div>
</body>
</html>
```

### 5. 更新进度

更新功能 README.md 中的进度。

## 输出示例

```
✅ UI 设计已完成

文档：docs/versions/v1.2.0/features/feat-002/02-design/ui-design.md
原型：docs/versions/v1.2.0/features/feat-002/02-design/prototype.html

你可以在浏览器中打开 prototype.html 查看交互原型

下一步：
- /write-tech - 继续编写技术设计
```

## 注意事项

- 遵循现有设计系统
- 优先复用现有组件
- HTML 原型必须可直接预览
- 考虑亮色和深色主题
