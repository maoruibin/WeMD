import { useCallback, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ThemePanel } from '../Theme/ThemePanel';
import './Header.css';
import { Palette, Send } from 'lucide-react';

export function Header() {
    const { copyToWechat } = useEditorStore();
    const workspaceDir = useEditorStore((state) => state.workspaceDir);
    const setWorkspaceDir = useEditorStore((state) => state.setWorkspaceDir);
    const [showThemePanel, setShowThemePanel] = useState(false);

    const handlePickWorkspace = useCallback(async () => {
        const electron = (window as any).electron;
        if (!electron?.file?.pickWorkspace) return;
        const result = await electron.file.pickWorkspace();
        if (result?.success && result.path) {
            setWorkspaceDir(result.path);
            try {
                localStorage.setItem('wemd-electron-workspace', result.path);
            } catch {
                /* ignore */
            }
        }
    }, [setWorkspaceDir]);

    const isElectron = typeof window !== 'undefined' && !!(window as any).electron;

    return (
        <>
            <header className="app-header">
                <div className="header-left">
                    <div className="logo">
                        <svg width="40" height="40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <path d="M40 20 H160 C171 20 180 29 180 40 V140 C180 151 171 160 160 160 H140 L140 185 L110 160 H40 C29 160 20 151 20 140 V40 C20 29 29 20 40 20 Z" fill="#1A1A1A" />
                            <rect x="50" y="50" width="100" height="12" rx="6" fill="#07C160" />
                            <path d="M60 85 L60 130 H80 L80 110 L100 130 L120 110 L120 130 H140 L140 85 L120 85 L100 105 L80 85 Z" fill="#FFFFFF" />
                        </svg>
                        <div className="logo-info">
                            <span className="logo-text">WeMD</span>
                            <span className="logo-subtitle">公众号 Markdown 排版编辑器</span>
                        </div>
                    </div>

                </div>

                <div className="header-right">
                    <button className="btn-secondary" onClick={() => setShowThemePanel(true)}>
                        <Palette size={18} strokeWidth={2} />
                        <span>主题管理</span>
                    </button>
                    <button className="btn-primary" onClick={copyToWechat}>
                        <Send size={18} strokeWidth={2} />
                        <span>复制到微信</span>
                    </button>
                </div>
            </header>

            <ThemePanel open={showThemePanel} onClose={() => setShowThemePanel(false)} />
        </>
    );
}
