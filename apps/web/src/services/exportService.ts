import * as core from '@wemd/core';

const { processHtml, createMarkdownParser } = core;
import { toPng } from 'html-to-image';
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
 * 生成渲染用的 DOM 容器并返回 dataUrl
 * 使用 html-to-image 库，比 html2canvas 更快且兼容性更好
 */
const generateImageDataUrl = async (markdown: string, themeCss: string, isForPdf: boolean = false): Promise<{ dataUrl: string; width: number; height: number }> => {
    const container = document.createElement('div');

    // 设置容器样式，确保宽度合适且不在视口中
    container.style.position = 'absolute';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.width = '800px'; // 微信公众号标准宽度附近
    container.style.background = '#fff'; // 确保有背景色
    container.style.padding = '40px'; // 增加内边距，让排版更舒服
    container.style.color = '#000'; // 确保文字颜色

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
        contentDiv.style.width = '100%';

        // 确保 processHtml 处理后的内容被正确注入
        const styledHtml = processHtml(rawHtml, themedCss);
        contentDiv.innerHTML = styledHtml;

        container.appendChild(contentDiv);

        // 等待图片加载并处理 Base64
        const images = contentDiv.querySelectorAll('img');
        console.log('=== 导出：正在等待图片加载 ===');
        console.log(`图片数量: ${images.length}`);

        const imagePromises = Array.from(images).map((img, index) => {
            return new Promise<void>((resolve) => {
                const imgEl = img as HTMLImageElement;
                const originalSrc = imgEl.src;

                // 尝试转 Base64 解决跨域问题
                const convertToBase64 = async () => {
                    try {
                        const response = await fetch(originalSrc);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            imgEl.src = reader.result as string;
                            console.log(`图片 ${index}: Base64 转换成功`);
                            resolve();
                        };
                        reader.onerror = () => {
                            console.warn(`图片 ${index}: Base64 转换失败，使用原链接`);
                            resolve();
                        };
                        reader.readAsDataURL(blob);
                    } catch (e) {
                        console.warn(`图片 ${index}: Fetch 失败 (${e})，使用原链接`);
                        resolve();
                    }
                };

                // 如果已经是 Base64 或本地路径，直接等待加载
                if (originalSrc.startsWith('data:') || originalSrc.startsWith('file://')) {
                    if (imgEl.complete) resolve();
                    else {
                        imgEl.onload = () => resolve();
                        imgEl.onerror = () => resolve();
                    }
                    return;
                }

                convertToBase64();
            });
        });

        await Promise.all(imagePromises);

        // 智能分页逻辑 (仅在导出 PDF 时启用)
        if (isForPdf) {
            console.log('=== 开始智能分页处理 ===');
            // A4 尺寸参考：210mm x 297mm
            // 在 96 DPI 下，A4 像素尺寸约为 794px x 1123px
            // 我们的容器宽度固定为 800px
            // 计算等比缩放后的单页高度
            const PAGE_HEIGHT = 1123 * (800 / 794); 
            
            let accumHeight = 0;
            // 必须获取所有直接子元素，因为样式是注入在这些元素上的
            // 注意：markdown-it 渲染出来的通常是平铺的 p, h1, ul, table 等，没有额外的 wrapper
            const nodes = Array.from(contentDiv.children) as HTMLElement[];
            
            nodes.forEach(node => {
                // 获取元素包含 margin 的高度
                const style = window.getComputedStyle(node);
                const marginTop = parseFloat(style.marginTop);
                const marginBottom = parseFloat(style.marginBottom);
                const nodeHeight = node.offsetHeight + marginTop + marginBottom;
                
                // 忽略高度极小的元素
                if (nodeHeight < 1) return;

                // 预测该元素放置后的底部位置
                const nodeBottom = accumHeight + nodeHeight;
                
                // 计算当前所在页码 (从0开始)
                const currentPage = Math.floor(accumHeight / PAGE_HEIGHT);
                // 计算当前页的分页线位置
                const pageBreak = (currentPage + 1) * PAGE_HEIGHT;

                // 核心判断：如果元素跨越了分页线
                // 并且元素本身高度小于一页（如果是超长元素，切断是不可避免的，或者需要内部切割，这里暂不处理超长元素内部切割）
                if (nodeBottom > pageBreak && nodeHeight < PAGE_HEIGHT) {
                    const spaceLeft = pageBreak - accumHeight;
                    console.log(`元素 <${node.tagName}> 跨页，插入垫片高度: ${spaceLeft}px`);
                    
                    const spacer = document.createElement('div');
                    spacer.style.height = `${spaceLeft}px`;
                    spacer.style.width = '100%';
                    spacer.style.backgroundColor = 'transparent'; // 透明即可，背景色由容器决定
                    spacer.className = 'pdf-page-break-spacer';
                    
                    // 插入到当前节点之前
                    contentDiv.insertBefore(spacer, node);
                    
                    // 累加垫片高度，现在 accumHeight 刚好等于 pageBreak
                    accumHeight += spaceLeft;
                }
                
                accumHeight += nodeHeight;
            });
            console.log('=== 智能分页处理完成 ===');
        }

        // 额外等待确保渲染完成
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('=== 开始生成图片 ===');

        // 使用 html-to-image 生成 PNG
        const dataUrl = await toPng(container, {
            quality: 1,
            pixelRatio: 2, // 2倍清晰度
            backgroundColor: '#ffffff',
            // 使用内联样式避免外部资源加载问题
            style: {
                margin: '0',
                padding: '0',
            },
            // 跳过缓存确保获取最新内容
            cacheBust: true,
        });

        console.log('=== 图片生成完成 ===');

        // 获取实际尺寸
        const { width, height } = container.getBoundingClientRect();

        return { dataUrl, width, height };
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
            const { dataUrl } = await generateImageDataUrl(markdown, themeCss);

            // 将 dataUrl 转换为 Blob 并下载
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const filename = `${title || 'WeMD_Export'}_${getTimestamp()}.png`;
            downloadFile(blob, filename);
            toast.success('已导出长图', { id: toastId });

        } catch (error) {
            console.error('Export Image failed:', error);
            toast.error('导出长图失败', { id: toastId });
        }
    },

    /**
     * 导出为 PDF (通过图片再生成 PDF，确保样式一致性)
     */
    async exportPDF(markdown: string, themeCss: string, title?: string) {
        const toastId = toast.loading('正在生成 PDF...');

        try {
            // 1. 先生成图片 dataUrl
            const { dataUrl, width, height } = await generateImageDataUrl(markdown, themeCss, true);

            // 2. 初始化 PDF (A4 纵向)
            // A4 尺寸: 210mm x 297mm
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = 210;
            const pageHeight = 297;

            // 3. 计算图片在 PDF 中的尺寸
            const imgWidth = pageWidth;
            const imgHeight = (height * pageWidth) / width;

            let heightLeft = imgHeight;
            let position = 0;

            // 第一页
            pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // 后续页
            while (heightLeft > 0) {
                position -= pageHeight; // 向上移动图片绘制起始点
                pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
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
