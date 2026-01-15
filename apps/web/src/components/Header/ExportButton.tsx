import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, FileDown } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useFileStore } from '../../store/fileStore';
import { exportService } from '../../services/exportService';
import './ExportButton.css';

export function ExportButton() {
    const { copyToWechat, markdown } = useEditorStore();
    const { currentFile } = useFileStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const title = currentFile?.name?.replace(/\.md$/i, '') || 'WeiMD_Article';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportMD = () => {
        exportService.exportMarkdown(markdown, title);
        setIsOpen(false);
    };

    return (
        <div className="export-split-btn" ref={dropdownRef}>
            <button className="export-main-btn" onClick={copyToWechat} title="复制到公众号">
                <Send size={16} strokeWidth={2} />
                <span>复制到公众号</span>
            </button>
            <div className="export-separator" />
            <button 
                className={`export-trigger-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="更多导出选项"
            >
                <ChevronDown size={16} />
            </button>
            
            {isOpen && (
                <div className="export-dropdown">
                    <button className="export-menu-item" onClick={handleExportMD}>
                        <FileDown size={16} />
                        <span>导出 Markdown</span>
                    </button>
                </div>
            )}
        </div>
    );
}
