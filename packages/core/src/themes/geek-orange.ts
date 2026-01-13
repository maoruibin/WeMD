export const geekOrangeTheme = `/*
 * ============================================
 * 主题名称：极客橙 (Tech Orange)
 * 设计理念：复刻 Skills 案例，高信噪比，逻辑清晰
 * ============================================
 */

/* 1. 全局容器：限制宽度，增加留白 */
#wemd {
    padding: 30px 20px;
    max-width: 677px;
    margin: 0 auto;
    font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    color: #333;
    background-color: transparent;
    font-size: 16px;
    letter-spacing: 0.05em; /* 稍微增加字间距，提升阅读通透感 */
}

/* 2. 段落：舒适的阅读节奏 */
#wemd p {
    margin: 20px 0; /* 加大段间距 */
    line-height: 1.8; /* 1.8倍行高，更显宽松 */
    text-align: justify;
    color: #3f3f3f; /* 稍微柔和一点的黑色 */
}

/* 3. 标题：极简主义，颜色区分 */
#wemd h1 {
    margin: 50px 0 30px;
    text-align: left; /* 左对齐，更符合现代阅读习惯 */
}

#wemd h1 .content {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    border-bottom: 3px solid #ff9c00; /* 底部橙色粗线条 */
    padding-bottom: 10px;
    display: inline-block; /* 线条只包裹文字长度 */
}

/* 二级标题：也就是你截图中 "Skills 到底是什么？" 的样式 */
#wemd h2 {
    margin: 40px 0 20px;
    text-align: left;
}

#wemd h2 .content {
    font-size: 20px;
    font-weight: bold;
    color: #e67e22; /* 核心橙色 */
}

#wemd h3 {
    margin: 30px 0 15px;
}

#wemd h3 .content {
    font-size: 17px;
    font-weight: bold;
    color: #333;
    padding-left: 10px;
    border-left: 4px solid #e67e22; /* 左侧橙色竖线 */
}

/* 隐藏所有原有的前后缀装饰 */
#wemd h1 .prefix, #wemd h1 .suffix,
#wemd h2 .prefix, #wemd h2 .suffix,
#wemd h3 .prefix, #wemd h3 .suffix {
    display: none;
}

/* 4. 重点与强调 */
#wemd strong {
    font-weight: bold;
    color: #e67e22; /* 加粗文字变橙色，突出重点 */
    margin: 0 2px;
}

#wemd em {
    font-style: italic;
    color: #666;
}

/* 链接：虚线底边 */
#wemd a {
    color: #e67e22;
    text-decoration: none;
    border-bottom: 1px dashed #e67e22;
    font-weight: bold;
}

/* 5. 引用块：浅色背景 */
#wemd .multiquote-1 {
    margin: 24px 0;
    padding: 20px;
    background: #fff8f0; /* 极浅的橙色背景 */
    border-left: 4px solid #ff9c00;
    border-radius: 6px;
}

#wemd .multiquote-1 p {
    margin: 0;
    color: #595959;
    font-size: 15px;
}

/* 连续引用块之间消除额外间距 */
#wemd .multiquote-1 + .multiquote-1,
#wemd .multiquote-2 + .multiquote-2,
#wemd .multiquote-3 + .multiquote-3,
#wemd .multiquote-1 + .multiquote-2,
#wemd .multiquote-2 + .multiquote-3 {
    margin-top: 0;
}

/* 6. 列表：简单的圆点 */
#wemd ul, #wemd ol {
    margin: 20px 0;
    padding-left: 0;
}

#wemd ul li {
    display: flex;
    align-items: baseline;
    margin-bottom: 8px;
}

#wemd ul li::before {
    content: "•";
    color: #ff9c00; /* 橙色圆点 */
    font-weight: bold;
    margin-right: 8px;
    flex-shrink: 0;
    line-height: 1.8; /* 与段落行高保持一致 */
}

#wemd ol {
    padding-left: 20px;
}

#wemd li section {
    margin: 0;
    line-height: 1.8;
    color: #333;
    flex: 1;
}

/* 移除默认列表样式 */
#wemd ul {
    list-style: none;
}

/* 7. 代码块 */
#wemd pre code.hljs {
    background: #fdf6e3; /* Solarized Light 风格背景，护眼 */
    border-radius: 6px;
    padding: 15px;
    font-family: Consolas, monospace;
    font-size: 13px;
    border: none;
    white-space: pre; /* 保持空白符，不自动换行 */
    overflow-x: auto; /* 水平方向可滚动 */
}
#wemd p code {
    background: #fff3e0;
    color: #e65100;
    padding: 2px 6px;
    border-radius: 4px;
    margin: 0 3px;
    font-size: 14px;
}

/* 8. 分割线 */
#wemd hr {
    margin: 40px 0;
    border: none;
    height: 1px;
    background-image: linear-gradient(to right, rgba(230, 126, 34, 0), rgba(230, 126, 34, 0.75), rgba(230, 126, 34, 0));
}

/* ============================================
 * 补充：提示块样式（复用橙色系风格）
 * ============================================
 */
#wemd .callout {
    margin: 20px 0;
    padding: 16px 20px;
    background: #fff8f0;
    border-left: 4px solid #ff9c00;
    border-radius: 6px;
}
#wemd .callout-title {
    font-weight: bold;
    margin-bottom: 8px;
    color: #e67e22;
    font-size: 15px;
}
#wemd .callout-icon { margin-right: 6px; }

/* 针对不同类型的微调，保持整体风格统一但有区分 */
#wemd .callout-note { border-left-color: #6366f1; background: #f5f5ff; }
#wemd .callout-info { border-left-color: #0ea5e9; background: #f0f9ff; }
#wemd .callout-tip { border-left-color: #10b981; background: #ecfdf5; }
#wemd .callout-success { border-left-color: #10b981; background: #ecfdf5; }
#wemd .callout-warning { border-left-color: #f59e0b; background: #fffbeb; }
#wemd .callout-danger { border-left-color: #ef4444; background: #fff5f5; }
`;
