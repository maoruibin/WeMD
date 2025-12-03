import {
    Bold, Italic, Strikethrough,
    Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Code,
    Link, Image, Minus
} from 'lucide-react';
import './Toolbar.css';

interface ToolbarProps {
    onInsert: (prefix: string, suffix: string, placeholder: string) => void;
}

export function Toolbar({ onInsert }: ToolbarProps) {
    const tools = [
        { icon: Bold, label: "粗体", prefix: "**", suffix: "**", placeholder: "粗体文字" },
        { icon: Italic, label: "斜体", prefix: "*", suffix: "*", placeholder: "斜体文字" },
        { icon: Strikethrough, label: "删除线", prefix: "~~", suffix: "~~", placeholder: "删除文字" },
        { icon: Heading1, label: "一级标题", prefix: "# ", suffix: "", placeholder: "标题" },
        { icon: Heading2, label: "二级标题", prefix: "## ", suffix: "", placeholder: "标题" },
        { icon: Heading3, label: "三级标题", prefix: "### ", suffix: "", placeholder: "标题" },
        { icon: List, label: "无序列表", prefix: "- ", suffix: "", placeholder: "列表项" },
        { icon: ListOrdered, label: "有序列表", prefix: "1. ", suffix: "", placeholder: "列表项" },
        { icon: Quote, label: "引用", prefix: "> ", suffix: "", placeholder: "引用文字" },
        { icon: Code, label: "代码块", prefix: "```\n", suffix: "\n```", placeholder: "代码" },
        { icon: Link, label: "链接", prefix: "[", suffix: "](url)", placeholder: "链接文字" },
        { icon: Image, label: "图片", prefix: "![", suffix: "](url)", placeholder: "图片描述" },
        { icon: Minus, label: "分割线", prefix: "\n---\n", suffix: "", placeholder: "" },
    ];

    return (
        <div className="md-toolbar">
            {tools.map((tool, index) => (
                <button
                    key={index}
                    className="md-toolbar-btn"
                    onClick={() => onInsert(tool.prefix, tool.suffix, tool.placeholder)}
                    title={tool.label}
                >
                    <tool.icon size={16} />
                </button>
            ))}
        </div>
    );
}
