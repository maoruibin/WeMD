import * as core from '@wemd/core';

const { processHtml, createMarkdownParser } = core;
import toast from 'react-hot-toast';
import katexCss from 'katex/dist/katex.min.css?raw';

const buildCss = (themeCss: string) => {
    if (!themeCss) return katexCss;
    return `${themeCss}\n${katexCss}`;
};

const getTimestamp = () => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
};

const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const cleanMarkdown = (markdown: string) => {
    // 移除 HTML 尾部模板，将其转换为引用块
    // 匹配 <section ...> ... </section> 结构
    return markdown.replace(/<section[^>]*>([\s\S]*?)<\/section>/gi, (match, content) => {
        // 移除 content 中的所有 HTML 标签，只保留文本
        const text = content.replace(/<[^>]+>/g, '').trim();
        // 将文本每一行都加上引用符号
        return text.split('\n').map(line => line.trim() ? `> ${line.trim()}` : '>').join('\n');
    });
};

export const exportService = {
    /**
     * 导出为 Markdown 文件
     */
    async exportMarkdown(markdown: string, title?: string) {
        try {
            const cleanedMarkdown = cleanMarkdown(markdown);
            const blob = new Blob([cleanedMarkdown], { type: 'text/markdown;charset=utf-8' });
            const filename = `${title || 'WeMD_Export'}_${getTimestamp()}.md`;
            downloadFile(blob, filename);
            toast.success('已导出 Markdown');
        } catch (error) {
            console.error('Export MD failed:', error);
            toast.error('导出 Markdown 失败');
        }
    },

    /**
     * 导出为 HTML
     */
    async exportHTML(markdown: string, themeCss: string, title?: string) {
        try {
            const parser = createMarkdownParser();
            const rawHtml = parser.render(markdown);
            const themedCss = buildCss(themeCss);
            const styledHtml = processHtml(rawHtml, themedCss);

            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title || 'WeMD Export'}</title>
    <style>
        ${themedCss}
    </style>
</head>
<body>
    <div id="js_content" style="visibility: visible;">
        ${styledHtml}
    </div>
</body>
</html>`;

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const filename = `${title || 'WeMD_Export'}_${getTimestamp()}.html`;
            downloadFile(blob, filename);
            toast.success('已导出 HTML');
        } catch (error) {
            console.error('Export HTML failed:', error);
            toast.error('导出 HTML 失败');
        }
    }
};
