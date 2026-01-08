/**
 * 预处理 Markdown 文本
 * 主要功能：自动将单换行转换为双换行（段落），以适应移动端阅读
 */
export function preprocessMarkdown(markdown: string): string {
    if (!markdown) return '';

    // 将连续的单换行转换为双换行（创建段落）
    // 但保留代码块、列表等特殊结构
    const lines = markdown.split('\n');
    const result: string[] = [];
    let inCodeBlock = false;
    let inList = false;
    let inHtmlBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 检测代码块开始/结束
        if (trimmed.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            result.push(line);
            continue;
        }

        // 检测 HTML 块开始/结束
        if (trimmed.startsWith('<div') || trimmed.startsWith('<p') || trimmed.startsWith('<section')) {
            inHtmlBlock = true;
        }
        if (trimmed.startsWith('</div>') || trimmed.startsWith('</p>') || trimmed.startsWith('</section>')) {
            inHtmlBlock = false;
        }

        // 在代码块或 HTML 块中，不做处理
        if (inCodeBlock || inHtmlBlock) {
            result.push(line);
            continue;
        }

        // 检测列表
        if (/^[>\s]*[-*+]\s/.test(trimmed) || /^\s*\d+\.\s/.test(trimmed)) {
            inList = true;
        } else if (trimmed === '' && inList) {
            // 列表结束
            inList = false;
        }

        // 在列表中，不做处理
        if (inList) {
            result.push(line);
            continue;
        }

        // 如果当前行不为空，下一行也不为空，且当前行不以特殊字符开头
        // 则在两行之间插入空行
        if (trimmed !== '' && i < lines.length - 1) {
            const nextLine = lines[i + 1].trim();
            if (
                nextLine !== '' &&
                !nextLine.startsWith('#') &&
                !nextLine.startsWith('>') &&
                !nextLine.startsWith('-') &&
                !nextLine.startsWith('*') &&
                !nextLine.startsWith('+') &&
                !nextLine.startsWith('|') &&
                !trimmed.endsWith('  ') // 不以两个空格结尾（表示硬换行）
            ) {
                result.push(line);
                result.push(''); // 插入空行
                continue;
            }
        }

        result.push(line);
    }

    return result.join('\n');
}
