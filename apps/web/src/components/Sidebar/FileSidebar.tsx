import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useFileSystem } from '../../hooks/useFileSystem';
import { useThemeStore } from '../../store/themeStore';
import { Search, Plus, Trash2, FolderOpen, Edit2, MoreHorizontal, Copy } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import './FileSidebar.css';

import type { FileItem } from '../../store/fileTypes';

// 每次加载的文件数量
const PAGE_SIZE = 50;

type DirectoryMode = 'flat' | 'folder';

export function FileSidebar() {
    const { files, currentFile, openFile, createFile, renameFile, deleteFile, selectWorkspace, workspacePath, getMode, migrateToFolder } = useFileSystem();
    const currentThemeName = useThemeStore((state) => state.themeName);
    const [filter, setFilter] = useState('');
    const [renamingPath, setRenamingPath] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [directoryMode, setDirectoryMode] = useState<DirectoryMode | null>(null);
    const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);

    // 无限滚动状态
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 右键菜单状态
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [menuTarget, setMenuTarget] = useState<FileItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const filteredFiles = useMemo(() => {
        if (!filter) return files;
        return files.filter(f => f.name.toLowerCase().includes(filter.toLowerCase()));
    }, [files, filter]);

    // 当前可见的文件列表
    const visibleFiles = useMemo(() => {
        return filteredFiles.slice(0, visibleCount);
    }, [filteredFiles, visibleCount]);

    // 是否还有更多文件可加载
    const hasMore = visibleCount < filteredFiles.length;

    // 加载更多文件
    const loadMore = useCallback(() => {
        if (hasMore) {
            setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredFiles.length));
        }
    }, [hasMore, filteredFiles.length]);

    // 使用 Intersection Observer 检测滚动到底部
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    // 搜索条件变化时重置可见数量
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [filter]);

    // 检测目录模式
    useEffect(() => {
        const checkMode = async () => {
            const mode = await getMode();
            setDirectoryMode(mode);
        };
        checkMode();
    }, [getMode]);

    // 执行迁移
    const handleMigrate = async () => {
        setIsMigrating(true);
        try {
            const result = await migrateToFolder();
            if (result.success) {
                toast.success(result.message);
                setDirectoryMode('folder');
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error('迁移失败');
        } finally {
            setIsMigrating(false);
            setShowMigrateConfirm(false);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuTarget(file);
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOpen(true);
    };

    const closeMenu = () => {
        setMenuOpen(false);
        setMenuTarget(null);
    };

    const startRename = (file: FileItem) => {
        setRenamingPath(file.path);
        setRenameValue(file.name.replace('.md', ''));
        closeMenu();
    };

    const copyTitle = async (file: FileItem) => {
        try {
            const title = file.name.replace('.md', '');
            await navigator.clipboard.writeText(title);
            toast.success('标题已复制');
        } catch {
            toast.error('复制失败');
        }
        closeMenu();
    };

    const submitRename = async () => {
        if (renamingPath && renameValue) {
            const file = files.find(f => f.path === renamingPath);
            if (file) {
                await renameFile(file, renameValue);
            }
        }
        setRenamingPath(null);
    };

    return (
        <aside className="file-sidebar">
            <div className="fs-header">
                <div className="fs-workspace-info" onClick={selectWorkspace} title={workspacePath || '选择工作区'}>
                    <FolderOpen size={14} />
                    <span>{workspacePath ? workspacePath.split('/').pop() : '选择工作区'}</span>
                </div>
                <div className="fs-actions">
                    <button className="fs-btn-secondary fs-btn-icon-only" onClick={createFile} title="新建文章">
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            <div className="fs-search">
                <div className="fs-search-wrapper">
                    <Search size={14} className="fs-search-icon" />
                    <input
                        type="text"
                        placeholder="搜索文件..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="fs-body">
                <div className="fs-list">
                    {visibleFiles.map(file => (
                        <div
                            key={file.path}
                            className={`fs-item ${currentFile?.path === file.path ? 'active' : ''}`}
                            onClick={() => openFile(file)}
                            onContextMenu={(e) => handleContextMenu(e, file)}
                        >
                            <div className="fs-item-main">
                                <div className="fs-title-block">
                                    <span className="fs-time">{new Date(file.updatedAt).toLocaleString()}</span>
                                    {renamingPath === file.path ? (
                                        <div className="fs-rename" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') submitRename();
                                                    if (e.key === 'Escape') setRenamingPath(null);
                                                }}
                                                autoFocus
                                            />
                                            <button onClick={() => submitRename()}>确认</button>
                                            <button onClick={() => setRenamingPath(null)}>取消</button>
                                        </div>
                                    ) : (
                                        <span className="fs-title" title={file.name}>{file.name}</span>
                                    )}
                                    {renamingPath !== file.path && (
                                        <span className="fs-theme-info">
                                            {currentFile?.path === file.path ? currentThemeName : (file.themeName || '默认主题')}
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="fs-action-trigger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleContextMenu(e, file);
                                    }}
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {/* 无限滚动触发器 */}
                    {hasMore && (
                        <div ref={loadMoreRef} className="fs-load-more">
                            <span>加载更多...</span>
                        </div>
                    )}
                    {filteredFiles.length === 0 && directoryMode === 'flat' && (
                        <div className="fs-empty">
                            <p>暂无文件</p>
                            {files.length === 0 && (
                                <button
                                    className="fs-migrate-btn"
                                    onClick={() => setShowMigrateConfirm(true)}
                                    style={{ marginTop: '12px', padding: '6px 12px', fontSize: '12px' }}
                                >
                                    从旧版迁移？
                                </button>
                            )}
                        </div>
                    )}
                    {filteredFiles.length === 0 && directoryMode !== 'flat' && (
                        <div className="fs-empty">暂无文件</div>
                    )}
                </div>
            </div>

            {/* Context Menu Portal */}
            {menuOpen && createPortal(
                <div className="fs-context-menu-overlay" onClick={closeMenu}>
                    <div
                        className="fs-context-menu"
                        style={{ top: menuPos.y, left: menuPos.x }}
                    >
                        <button onClick={() => copyTitle(menuTarget)}>
                            <Copy size={14} /> 复制标题
                        </button>
                        <button onClick={() => startRename(menuTarget)}>
                            <Edit2 size={14} /> 重命名
                        </button>
                        <button className="danger" onClick={() => { setDeleteTarget(menuTarget); closeMenu(); }}>
                            <Trash2 size={14} /> 删除
                        </button>
                    </div>
                </div>,
                document.body
            )}
            {deleteTarget &&
                createPortal(
                    <div className="history-confirm-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
                        <div className="history-confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <h4>删除文件</h4>
                            <p>确定要删除"{deleteTarget.name}"吗？此操作不可撤销。</p>
                            <div className="history-confirm-actions">
                                <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                    取消
                                </button>
                                <button
                                    className="btn-danger"
                                    onClick={async () => {
                                        setDeleting(true);
                                        try {
                                            await deleteFile(deleteTarget);
                                        } finally {
                                            setDeleting(false);
                                            setDeleteTarget(null);
                                            closeMenu();
                                        }
                                    }}
                                    disabled={deleting}
                                >
                                    {deleting ? '删除中...' : '确认删除'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            {/* 迁移确认对话框 */}
            {showMigrateConfirm &&
                createPortal(
                    <div className="history-confirm-backdrop" onClick={() => !isMigrating && setShowMigrateConfirm(false)}>
                        <div className="history-confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <h4>迁移到文件夹模式</h4>
                            <p>
                                这将把现有的 .md 文件转换为文件夹结构（文件夹/article.md）。
                                <br /><br />
                                例如：<code>文章A.md</code> → <code>文章A/article.md</code>
                                <br /><br />
                                建议先备份原有文件。
                            </p>
                            <div className="history-confirm-actions">
                                <button className="btn-secondary" onClick={() => setShowMigrateConfirm(false)} disabled={isMigrating}>
                                    取消
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleMigrate}
                                    disabled={isMigrating}
                                    style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: isMigrating ? 'not-allowed' : 'pointer' }}
                                >
                                    {isMigrating ? '迁移中...' : '确认迁移'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </aside>
    );
}
