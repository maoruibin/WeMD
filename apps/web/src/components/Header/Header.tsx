import { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ThemePanel } from '../Theme/ThemePanel';
import { StorageModeSelector } from '../StorageModeSelector/StorageModeSelector';
import { ImageHostSettings } from '../Settings/ImageHostSettings';
import './Header.css';
import { Palette, ImageIcon, Sun, Moon, MoreHorizontal, Database, Menu, HelpCircle, X, Info, Users, ArrowLeft, Pilcrow } from 'lucide-react';
import { useUITheme } from '../../hooks/useUITheme';
import { useUIStore } from '../../store/uiStore';
import { ExportButton } from './ExportButton';

const DefaultLogoMark = () => (
    <svg width="40" height="40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M40 20 H160 C171 20 180 29 180 40 V140 C180 151 171 160 160 160 H140 L140 185 L110 160 H40 C29 160 20 151 20 140 V40 C20 29 29 20 40 20 Z" fill="#1A1A1A" />
        <rect x="50" y="50" width="100" height="12" rx="6" fill="#07C160" />
        <path d="M60 85 L60 130 H80 L80 110 L100 130 L120 110 L120 130 H140 L140 85 L120 85 L100 105 L80 85 Z" fill="#FFFFFF" />
    </svg>
);

const structuralismLogoSrc = `${import.meta.env.BASE_URL}favicon-light.svg`;

const StructuralismLogoMark = () => (
    <img src={structuralismLogoSrc} alt="WeiMD Logo" width={40} height={40} style={{ display: 'block' }} />
);

export function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const isEditorPage = location.pathname === '/';
    const isShowcasePage = location.pathname === '/showcase';

    const [showThemePanel, setShowThemePanel] = useState(false);
    const [showStorageModal, setShowStorageModal] = useState(false);
    const [showImageHostModal, setShowImageHostModal] = useState(false);
    const uiTheme = useUITheme((state) => state.theme);
    const setTheme = useUITheme((state) => state.setTheme);
    const { toggleSidebar, isAutoParagraph, setAutoParagraph } = useUIStore();
    const isStructuralismUI = uiTheme === 'dark';

    const isElectron = typeof window !== 'undefined' && !!(window as unknown as { electron?: unknown }).electron;

    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <div className="header-layout-wrapper">
                <header className="app-header">
                    <div className="header-left">
                        {isEditorPage ? (
                            <button
                                className="btn-ghost"
                                onClick={toggleSidebar}
                                aria-label="展开侧边栏"
                                title="展开侧边栏"
                            >
                                <Menu size={20} strokeWidth={2} />
                            </button>
                        ) : isShowcasePage ? (
                            <button
                                className="btn-ghost"
                                onClick={() => navigate('/')}
                                aria-label="返回编辑器"
                                title="返回编辑器"
                            >
                                <ArrowLeft size={20} strokeWidth={2} />
                            </button>
                        ) : null}
                        
                        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
                            {isStructuralismUI ? <StructuralismLogoMark /> : <DefaultLogoMark />}
                            <div className="logo-info">
                                <span className="logo-text">WeiMD</span>
                                <span className="logo-subtitle">公众号 Markdown 排版编辑器</span>
                            </div>
                        </Link>
                    </div>

                    <div className="header-right">
                        {!isShowcasePage && (
                            <button
                                className="btn-icon-only"
                                onClick={() => setTheme(uiTheme === 'dark' ? 'default' : 'dark')}
                                aria-label={uiTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
                                title={uiTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
                            >
                                {uiTheme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
                            </button>
                        )}

                        {isEditorPage && (
                            <button
                                className="btn-icon-only"
                                onClick={() => setShowThemePanel(true)}
                                aria-label="主题管理"
                                title="主题管理"
                            >
                                <Palette size={20} strokeWidth={2} />
                            </button>
                        )}

                        {!isEditorPage && !isShowcasePage ? (
                            <button 
                                className="btn-icon-only"
                                onClick={() => navigate('/')}
                                aria-label="关闭文档"
                                title="关闭文档"
                            >
                                <X size={20} strokeWidth={2} />
                            </button>
                        ) : (
                            <div className="header-menu-container" ref={moreMenuRef}>
                                <button 
                                    className="btn-icon-only"
                                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                                    aria-label="更多设置"
                                    title="更多设置"
                                >
                                    <MoreHorizontal size={20} strokeWidth={2} />
                                </button>
                                
                                {showMoreMenu && (
                                    <div className="header-menu">
                                        {isEditorPage && (
                                            <>
                                                <button className="header-menu-item" onClick={() => {
                                                    setShowImageHostModal(true);
                                                    setShowMoreMenu(false);
                                                }}>
                                                    <ImageIcon />
                                                    <span>图床设置</span>
                                                </button>
                                                {!isElectron && (
                                                    <button className="header-menu-item" onClick={() => {
                                                        setShowStorageModal(true);
                                                        setShowMoreMenu(false);
                                                    }}>
                                                        <Database />
                                                        <span>存储模式</span>
                                                    </button>
                                                )}
                                                <Link to="/showcase" className="header-menu-item" onClick={() => setShowMoreMenu(false)}>
                                                    <Users />
                                                    <span>创作者案例</span>
                                                </Link>
                                            </>
                                        )}
                                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
                                        <a href="/docs/" target="_blank" rel="noopener noreferrer" className="header-menu-item" onClick={() => setShowMoreMenu(false)}>
                                            <HelpCircle />
                                            <span>帮助中心</span>
                                        </a>
                                        <a href="/docs/about/intro.html" target="_blank" rel="noopener noreferrer" className="header-menu-item" onClick={() => setShowMoreMenu(false)}>
                                            <Info />
                                            <span>关于我们</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {isEditorPage && <ExportButton />}
                    </div>
                </header>
            </div>

            <ThemePanel open={showThemePanel} onClose={() => setShowThemePanel(false)} />

            {showStorageModal && (
                <div className="storage-modal-overlay" onClick={() => setShowStorageModal(false)}>
                    <div className="storage-modal-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="storage-modal-header">
                            <h3>选择存储模式</h3>
                            <button className="storage-modal-close" onClick={() => setShowStorageModal(false)} aria-label="关闭">
                                ×
                            </button>
                        </div>
                        <StorageModeSelector />
                    </div>
                </div>
            )}

            {showImageHostModal && (
                <div className="storage-modal-overlay" onClick={() => setShowImageHostModal(false)}>
                    <div className="storage-modal-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="storage-modal-header">
                            <h3>图床设置</h3>
                            <button className="storage-modal-close" onClick={() => setShowImageHostModal(false)} aria-label="关闭">
                                ×
                            </button>
                        </div>
                        <ImageHostSettings />
                    </div>
                </div>
            )}
        </>
    );
}
