# WeiMD 主题实现技术文档

## 1. 概述

WeiMD 的主题系统旨在将标准的 Markdown 内容转换为微信公众号兼容的富文本 HTML。核心原理是利用 CSS 选择器匹配特定的 HTML 结构，并通过 `juice` 库将 CSS 样式内联（Inline）到 HTML 标签的 `style` 属性中。

## 2. 数据结构

### 2.1 Theme 接口

主题在代码中以对象形式存在，主要包含以下字段（参考 `apps/web/src/store/themeStore.ts`）：

```typescript
interface CustomTheme {
    id: string;        // 唯一标识
    name: string;      // 主题名称
    css: string;       // 核心 CSS 代码
    isBuiltIn: boolean;// 是否为内置主题
    createdAt?: string;
    updatedAt?: string;
}
```

### 2.2 存储

- **内置主题**: 定义在 `@wemd/core` 或 `apps/web/src/store/themes/builtInThemes.ts` 中，硬编码在应用内。
- **自定义主题**: 存储在浏览器 `localStorage` 的 `wemd-custom-themes` 字段中。

## 3. 渲染管线

主题的应用过程发生在渲染阶段：

1. **Markdown 解析 (`MarkdownParser.ts`)**:
   - `markdown-it` 将 Markdown 文本转换为 HTML。
   - 关键插件 `markdown-it-span` 会将标题 (`h1`-`h6`) 转换为包含三个 `span` 的结构，以便分别设置前缀、内容和后缀样式：
     ```html
     <h1>
       <span class="prefix"></span>
       <span class="content">标题文本</span>
       <span class="suffix"></span>
     </h1>
     ```
   - 所有内容被包裹在一个 `<section id="wemd">` 容器中。

2. **样式处理 (`ThemeProcessor.ts`)**:
   - 函数 `processHtml(html, css)` 负责处理。
   - 它使用 `juice` 库，根据传入的 CSS 字符串，将样式应用到对应的 HTML 元素上。
   - 例如，如果 CSS 有 `#wemd p { color: red; }`，那么所有的 `<p>` 标签会被转换为 `<p style="color: red;">`。
   - **重要**: 微信公众号编辑器不支持 `<style>` 标签（部分支持但有限制），因此必须进行内联处理。

## 4. CSS 规范

为了适配 WeiMD 的渲染逻辑，主题 CSS 必须遵循以下规范：

- **根作用域**: 所有选择器必须以 `#wemd` 开头。
  - 正确: `#wemd p { ... }`
  - 错误: `p { ... }`
- **特定元素类名**:
  - 标题内容: `.content`
  - 标题修饰: `.prefix`, `.suffix`
  - 代码块: `pre code.hljs`
  - 引用: `.multiquote-1`, `.multiquote-2`
  - GitHub Alerts: `.callout`, `.callout-tip` 等

详细的 CSS 选择器指南可参考 `apps/docs/src/guide/themes.md`。

## 5. 深色模式适配

WeiMD 拥有独特的深色模式处理机制，无需为每个主题编写两套 CSS。

### 5.1 原理

微信公众号阅读器会自动对文章进行深色模式适配，但效果有时不可控。WeiMD 提供了预览时的深色模拟。

在 `themeStore.ts` 中，`getThemeCSS` 方法负责获取最终 CSS：

1. 获取基础 CSS（内置或自定义）。
2. 如果开启了深色模式 (`darkMode = true`)：
   - 检查缓存 `darkCssCache`。
   - 如果 CSS 中包含特殊标记 `/* wemd-wechat-dark-converted */`，则跳过转换。
   - 否则，调用 `convertCssToWeChatDarkMode(css)` 算法。

### 5.2 转换算法 (`packages/core/src/wechatDarkMode.ts`)

该算法解析 CSS 字符串，识别颜色属性（color, background-color, border-color 等），并将其转换为适合深色背景的颜色。
- 降低亮度过高的背景色。
- 提亮过暗的文字颜色。
- 保持高饱和度的品牌色基本不变（通过一定的阈值判断）。

## 6. 扩展与开发

### 添加新内置主题

1. 在 `packages/core/src/themes/` 下创建新的 `.ts` 文件，导出 CSS 字符串。
2. 在 `packages/core/src/themes/index.ts` 中注册。
3. 重新构建 `@wemd/core`。

### 用户自定义主题

用户在前端界面创建的主题直接保存在本地。导出时，可以通过复制 CSS 代码分享给他人。
