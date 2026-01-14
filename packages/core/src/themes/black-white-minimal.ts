export const blackWhiteMinimalTheme = `/*
 * ============================================
 * 主题名称：黑白极简 (Black & White Minimal)
 * 设计理念：VSCode 风格，黑白分明，关注文字本身
 * ============================================
 */

/* 1. 全局容器：极简布局 */
#wemd {
    padding: 20px;
    max-width: 677px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    color: #000000;
    background-color: transparent;
    font-size: 17px;
    line-height: 1.8;
}

/* 2. 段落：纯粹的文字力量 */
#wemd p {
    margin: 16px 0;
    line-height: 1.8;
    text-align: left;
    color: #000000;
    font-size: 17px;
}

/* 3. 标题：保留 Markdown 符号装饰 */
#wemd h1,
#wemd h2,
#wemd h3,
#wemd h4,
#wemd h5,
#wemd h6 {
    margin-top: 32px;
    margin-bottom: 16px;
    font-weight: 700;
    color: #000000;
    line-height: 1.4;
}

/* H1: 大号标题 + 底部横线 */
#wemd h1 {
    font-size: 38px;
    margin-top: 0;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e5e5;
}

#wemd h1 .content {
    font-size: 38px;
    font-weight: 700;
    color: #000000;
}

/* H2 */
#wemd h2 {
    font-size: 28px;
}

#wemd h2 .content {
    font-size: 28px;
    font-weight: 700;
    color: #000000;
}

/* 隐藏空的 prefix，避免产生额外间隙 */
#wemd h2 .prefix {
    display: none;
}

/* H3 */
#wemd h3 {
    font-size: 24px;
}

#wemd h3 .content {
    font-size: 24px;
    font-weight: 700;
    color: #000000;
}

/* 隐藏空的 prefix，避免产生额外间隙 */
#wemd h3 .prefix {
    display: none;
}

/* H4-H6 */
#wemd h4 { font-size: 20px; font-weight: 700; }
#wemd h5 { font-size: 18px; font-weight: 700; }
#wemd h6 { font-size: 17px; font-weight: 700; }

/* 隐藏后缀 */
#wemd h1 .suffix,
#wemd h2 .suffix,
#wemd h3 .suffix,
#wemd h4 .suffix,
#wemd h5 .suffix,
#wemd h6 .suffix {
    display: none;
}

/* 4. 重点与强调：纯粹加粗 */
#wemd strong {
    font-weight: 700;
    color: #000000;
}

#wemd em {
    font-style: italic;
    color: #000000;
}

/* 5. 链接：经典蓝色虚线 */
#wemd a {
    color: #0969da;
    text-decoration: none;
    border-bottom: 1px dashed #0969da;
    font-weight: normal;
}

#wemd a:hover {
    border-bottom-style: solid;
}

/* 6. 引用块：极简灰色 */
#wemd .multiquote-1 {
    margin: 20px 0;
    padding: 16px;
    background: #f6f8fa;
    border-left: 4px solid #d0d7de;
    border-radius: 0;
}

#wemd .multiquote-1 p {
    margin: 0;
    color: #000000;
    font-size: 15px;
}

#wemd .multiquote-2 {
    padding: 16px;
    margin: 20px 0;
    background: #f6f8fa;
}

#wemd .multiquote-3 {
    padding: 16px;
    margin: 20px 0;
    background: #f6f8fa;
    text-align: center;
}

/* 连续引用块之间消除额外间距 */
#wemd .multiquote-1 + .multiquote-1,
#wemd .multiquote-2 + .multiquote-2,
#wemd .multiquote-3 + .multiquote-3,
#wemd .multiquote-1 + .multiquote-2,
#wemd .multiquote-2 + .multiquote-3 {
    margin-top: 0;
}

/* 7. 列表：简洁 */
#wemd ul,
#wemd ol {
    margin: 16px 0;
    padding-left: 24px;
    color: #000000;
}

#wemd ul {
    list-style-type: disc;
}

#wemd ul ul {
    list-style-type: circle;
}

#wemd ol {
    list-style-type: decimal;
}

#wemd li section {
    margin: 4px 0;
    line-height: 1.8;
    color: #000000;
}

/* 8. 分隔线：极简灰色 */
#wemd hr {
    height: 1px;
    margin: 32px 0;
    border: none;
    background: #e5e5e5;
}

/* 9. 行内代码：浅灰背景 */
#wemd p code,
#wemd li code {
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 6px;
    margin: 0 2px;
    color: #000000;
    background: #f6f8fa;
    font-family: "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    word-break: break-all;
}

/* 10. 图片 */
#wemd img {
    display: block;
    margin: 20px auto;
    max-width: 100%;
    border-radius: 6px;
}

#wemd figure {
    margin: 20px 0;
}

#wemd figcaption {
    margin-top: 8px;
    text-align: center;
    color: #6e7681;
    font-size: 14px;
}

/* 11. 表格 */
#wemd .table-container {
    overflow-x: auto;
    margin: 20px 0;
}

#wemd table {
    display: table;
    text-align: left;
    border-collapse: collapse;
    width: 100%;
}

#wemd table tr {
    border: none;
    border-top: 1px solid #d0d7de;
    background-color: #ffffff;
}

#wemd table tr:nth-child(2n) {
    background-color: #f6f8fa;
}

#wemd table tr th,
#wemd table tr td {
    font-size: 15px;
    border: 1px solid #d0d7de;
    padding: 8px 12px;
    text-align: left;
}

#wemd table tr th {
    font-weight: 600;
    background-color: #f6f8fa;
}

/* 12. Callout 提示块：极简风格 */
#wemd .callout {
    margin: 20px 0;
    padding: 16px 20px;
    border-radius: 6px;
    border: 1px solid #d0d7de;
    background: #f6f8fa;
}

#wemd .callout-title {
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #000000;
}

#wemd .callout-icon {
    font-size: 16px;
}

/* 不同类型保持极简但有区分 */
#wemd .callout-note { border-left-color: #0969da; }
#wemd .callout-tip { border-left-color: #1a7f37; }
#wemd .callout-important { border-left-color: #8250df; }
#wemd .callout-warning { border-left-color: #9a6700; }
#wemd .callout-caution { border-left-color: #cf222e; }

/* 13. 任务列表 */
#wemd .task-list-item {
    list-style: none;
    margin-left: -1.2em;
    margin-bottom: 8px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
}

#wemd .task-list-item input[type='checkbox'] {
    margin-top: 6px;
    pointer-events: none;
}
`;

/* VSCode Dark+ 代码高亮主题 */
export const vscodeDarkCodeTheme = `/*
 * VSCode Dark+ 代码高亮
 * 与黑白正文形成鲜明对比
 */

#wemd .hljs {
    display: block;
    overflow-x: auto;
    padding: 16px;
    color: #d4d4d4;
    background: #1e1e1e;
    border-radius: 6px;
    font-family: "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 14px;
    line-height: 1.6;
}

/* 关键字 - 蓝色 */
#wemd .hljs-keyword,
#wemd .hljs-selector-tag {
    color: #569cd6;
    font-weight: normal;
}

/* 函数名 - 黄色 */
#wemd .hljs-title,
#wemd .hljs-section {
    color: #dcdcaa;
    font-weight: normal;
}

/* 字符串 - 橙色 */
#wemd .hljs-string,
#wemd .hljs-doctag {
    color: #ce9178;
}

/* 数字 - 浅绿色 */
#wemd .hljs-number,
#wemd .hljs-literal {
    color: #b5cea8;
}

/* 注释 - 灰色 */
#wemd .hljs-comment,
#wemd .hljs-quote {
    color: #6a9955;
    font-style: normal;
}

/* 类型/类名 - 青色 */
#wemd .hljs-type,
#wemd .hljs-class .hljs-title {
    color: #4ec9b0;
    font-weight: normal;
}

/* 变量 - 白色 */
#wemd .hljs-variable,
#wemd .hljs-name {
    color: #9cdcfe;
}

/* 标签/属性 - 紫色 */
#wemd .hljs-tag,
#wemd .hljs-attribute {
    color: #569cd6;
}

/* 正则 - 红色 */
#wemd .hljs-regexp,
#wemd .hljs-link {
    color: #d16969;
}

/* 内置对象 - 浅紫色 */
#wemd .hljs-built_in,
#wemd .hljs-builtin-name {
    color: #4ec9b0;
}

/* meta 信息 - 灰色 */
#wemd .hljs-meta {
    color: #d7ba7d;
}

/* 删除线 - 红色背景 */
#wemd .hljs-deletion {
    background: #482828;
    color: #f48771;
}

/* 新增 - 绿色背景 */
#wemd .hljs-addition {
    background: #284828;
    color: #89d185;
}

/* 强调 */
#wemd .hljs-emphasis {
    font-style: italic;
}

#wemd .hljs-strong {
    font-weight: bold;
    color: #569cd6;
}

/* 行内代码在深色背景中 */
#wemd pre code {
    display: block;
    font-family: "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 14px;
    white-space: pre;
    color: #d4d4d4;
    background: #1e1e1e;
}
`;
