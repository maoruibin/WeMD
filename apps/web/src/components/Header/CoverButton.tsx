import { useFileStore } from '../../store/fileStore';
import { Image } from 'lucide-react';
import './CoverButton.css';

/**
 * Gudong Cover 封面生成按钮
 * 点击后跳转到 https://cover.gudong.site/ 并传递文章标题参数
 */
export function CoverButton() {
    const { currentFile } = useFileStore();

    // 从文件名提取标题（去除 .md 后缀）
    const title = currentFile?.name?.replace(/\.md$/i, '') || 'WeiMD_Article';

    const handleClick = () => {
        // 构建 URL 参数
        const params = new URLSearchParams({
            title: title,
            from: 'weimd'
        });

        // 在新标签页打开 Gudong Cover
        window.open(`https://cover.gudong.site/?${params.toString()}`, '_blank');
    };

    return (
        <button
            className="cover-btn"
            onClick={handleClick}
            title="生成公众号封面图"
        >
            <Image size={16} strokeWidth={2} />
            <span>生成封面</span>
        </button>
    );
}
