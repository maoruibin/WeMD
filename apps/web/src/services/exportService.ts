import * as core from '@wemd/core';

const { processHtml, createMarkdownParser } = core;
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import katexCss from 'katex/dist/katex.min.css?raw';
import { loadMathJax } from '../utils/mathJaxLoader';
import { hasMathFormula } from '../utils/katexRenderer';

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

/**
 * 生成渲染用的 DOM 容器和 Canvas
 */
const generateCanvas = async (markdown: string, themeCss: string): Promise<HTMLCanvasElement> => {
    const container = document.createElement('div');
    
    // 设置容器样式，确保宽度合适且不在视口中
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '800px'; // 微信公众号标准宽度附近
    container.style.zIndex = '-9999';
    container.style.background = '#fff'; // 确保有背景色
    container.style.padding = '40px'; // 增加内边距，让排版更舒服
    
    document.body.appendChild(container);

    try {
        const shouldLoadMath = hasMathFormula(markdown);
        if (shouldLoadMath) {
            await loadMathJax();
        }
        const parser = createMarkdownParser();
        const rawHtml = parser.render(markdown);
        const themedCss = buildCss(themeCss);
        
        // 注入样式
        const style = document.createElement('style');
        style.innerHTML = themedCss;
        container.appendChild(style);
        
        // 注入内容容器 (模拟微信内容区)
        const contentDiv = document.createElement('div');
        contentDiv.id = 'js_content';
        contentDiv.style.visibility = 'visible';
        
        // 确保 processHtml 处理后的内容被正确注入
        const styledHtml = processHtml(rawHtml, themedCss);
        contentDiv.innerHTML = styledHtml;
        
        container.appendChild(contentDiv);

        // 等待图片加载
        const images = container.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }));

        // 稍微延迟一点，确保布局稳定
        await new Promise(resolve => setTimeout(resolve, 300));

        const canvas = await html2canvas(container, {
            useCORS: true,
            scale: 2, // 高清
            backgroundColor: '#ffffff',
            logging: false,
            // 增加宽高缓冲，防止边缘截断
            width: container.offsetWidth,
            height: container.offsetHeight,
            windowWidth: container.scrollWidth,
            windowHeight: container.scrollHeight
        });

        return canvas;
    } finally {
        document.body.removeChild(container);
    }
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
    },

    /**
     * 导出为长图
     */
    async exportImage(markdown: string, themeCss: string, title?: string) {
        const toastId = toast.loading('正在生成长图...');
        
        try {
            const canvas = await generateCanvas(markdown, themeCss);

            canvas.toBlob((blob) => {
                if (blob) {
                    const filename = `${title || 'WeMD_Export'}_${getTimestamp()}.png`;
                    downloadFile(blob, filename);
                    toast.success('已导出长图', { id: toastId });
                } else {
                    throw new Error('Canvas blob is null');
                }
            }, 'image/png');

        } catch (error) {
            console.error('Export Image failed:', error);
            toast.error('导出长图失败', { id: toastId });
        }
    },

    /**
     * 导出为 PDF (通过 Canvas 转图片再生成 PDF，确保样式一致性)
     */
    async exportPDF(markdown: string, themeCss: string, title?: string) {
        const toastId = toast.loading('正在生成 PDF...');
        
        try {
            // 1. 先生成 Canvas (复用长图生成逻辑)
            const canvas = await generateCanvas(markdown, themeCss);
            
            // 2. 初始化 PDF (A4 纵向)
            // A4 尺寸: 210mm x 297mm
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = 210;
            const pageHeight = 297;
            
            // 3. 计算图片在 PDF 中的尺寸
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            
            // 使用 JPEG 格式减小体积，质量 0.95
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            let heightLeft = imgHeight;
            let position = 0;

            // 第一页
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // 后续页
            while (heightLeft > 0) {
                position -= pageHeight; // 向上移动图片绘制起始点
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const filename = `${title || 'WeMD_Export'}_${getTimestamp()}.pdf`;
            pdf.save(filename);
            toast.success('已导出 PDF', { id: toastId });

        } catch (error) {
            console.error('Export PDF failed:', error);
            toast.error('导出 PDF 失败', { id: toastId });
        }
    }
};
