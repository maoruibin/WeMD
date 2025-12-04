import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Search, Plus, Trash2, MoreHorizontal, Edit2, Copy, Save } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import type { HistorySnapshot } from '../../store/historyStore';
import { useStorageContext } from '../../storage/StorageContext';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import type { FileItem as StorageFileItem } from '../../storage/types';
import './HistoryPanel.css';

const defaultFsContent = `---
theme: default
themeName: 默认主题
---

# 新文章

`;

function parseFsFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {
      body: content,
      theme: 'default',
      themeName: '默认主题',
    };
  }
  const raw = match[1];
  const body = content.slice(match[0].length).trimStart();
  const theme = raw.match(/theme:\s*(.+)/)?.[1]?.trim() ?? 'default';
  const themeName = raw.match(/themeName:\s*(.+)/)?.[1]?.trim()?.replace(/^['"]|['"]$/g, '') ?? '默认主题';
  return { body, theme, themeName };
}

function formatDate(value?: string | number | Date) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

export function HistoryPanel() {
  const { adapter, type } = useStorageContext();
  if (type === 'filesystem' && adapter) {
    return <FileSystemHistory adapter={adapter} />;
  }
  return <IndexedHistoryPanel />;
}

function IndexedHistoryPanel() {
  const history = useHistoryStore((state) => state.history);
  const loading = useHistoryStore((state) => state.loading);
  const filter = useHistoryStore((state) => state.filter);
  const setFilter = useHistoryStore((state) => state.setFilter);
  const deleteEntry = useHistoryStore((state) => state.deleteEntry);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const saveSnapshot = useHistoryStore((state) => state.saveSnapshot);
  const updateTitle = useHistoryStore((state) => state.updateTitle);
  const persistActive = useHistoryStore((state) => state.persistActiveSnapshot);
  const activeId = useHistoryStore((state) => state.activeId);
  const setActiveId = useHistoryStore((state) => state.setActiveId);
  const loadHistory = useHistoryStore((state) => state.loadHistory);

  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const setTheme = useEditorStore((state) => state.setTheme);
  const setCustomCSS = useEditorStore((state) => state.setCustomCSS);
  const themeName = useEditorStore((state) => state.themeName);
  const resetDocument = useEditorStore((state) => state.resetDocument);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState<string>('未命名文章');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [menuEntry, setMenuEntry] = useState<HistorySnapshot | null>(null);

  const handleRestore = async (entry?: HistorySnapshot) => {
    if (!entry) return;
    const editorState = useEditorStore.getState();
    await persistActive({
      markdown: editorState.markdown,
      theme: editorState.theme,
      customCSS: editorState.customCSS,
      themeName,
    });
    setMarkdown(entry.markdown);
    setTheme(entry.theme);
    setCustomCSS(entry.customCSS);
    setActiveId(entry.id);
    setRenamingId(null);
    setActionMenuId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    if (renamingId === id) {
      setRenamingId(null);
    }
    if (activeId === id) {
      const { history: updatedHistory, activeId: nextActive } = useHistoryStore.getState();
      if (nextActive) {
        const nextEntry = updatedHistory.find((item) => item.id === nextActive);
        if (nextEntry) {
          setMarkdown(nextEntry.markdown);
          setTheme(nextEntry.theme);
          setCustomCSS(nextEntry.customCSS);
        }
      } else {
        resetDocument();
      }
    }
  };

  const handleCreateArticle = async () => {
    const initial = '# 新文章\n\n';
    const editorState = useEditorStore.getState();
    await persistActive({
      markdown: editorState.markdown,
      theme: editorState.theme,
      customCSS: editorState.customCSS,
      themeName,
    });
    resetDocument({ markdown: initial, theme: 'default', customCSS: '', themeName });
    const newEntry = await saveSnapshot(
      { markdown: initial, theme: 'default', customCSS: '', title: '新文章', themeName },
      { force: true },
    );
    if (newEntry) {
      setActiveId(newEntry.id);
    }
    toast.success('已创建新文章');
  };

  const startRename = (entry: HistorySnapshot) => {
    setRenamingId(entry.id);
    setTempTitle(entry.title || '未命名文章');
    setActionMenuId(null);
    setMenuEntry(null);
  };

  const confirmRename = async (entry: HistorySnapshot) => {
    await updateTitle(entry.id, tempTitle);
    toast.success('标题已更新');
    setRenamingId(null);
  };

  const copyTitle = async (entry: HistorySnapshot) => {
    try {
      await navigator.clipboard.writeText(entry.title || '未命名文章');
      toast.success('标题已复制');
    } catch (error) {
      console.error(error);
      toast.error('复制失败');
    }
  };

  const handleMenuToggle = (event: React.MouseEvent, entry: HistorySnapshot) => {
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const width = 180;
    const padding = 12;
    const maxLeft = window.innerWidth - width - padding;
    const minLeft = padding;
    const desiredLeft = rect.right - width;
    const left = Math.max(minLeft, Math.min(maxLeft, desiredLeft));
    const top = rect.bottom + 8;

    if (actionMenuId === entry.id) {
      setActionMenuId(null);
      setMenuEntry(null);
      return;
    }

    setActionMenuId(entry.id);
    setMenuEntry(entry);
    setMenuPosition({ top, left });
  };

  const closeActionMenu = () => {
    setActionMenuId(null);
    setMenuEntry(null);
  };

  useEffect(() => {
    const handleWindowClick = () => closeActionMenu();
    const handleWindowScroll = () => closeActionMenu();
    window.addEventListener('click', handleWindowClick);
    window.addEventListener('scroll', handleWindowScroll, true);
    return () => {
      window.removeEventListener('click', handleWindowClick);
      window.removeEventListener('scroll', handleWindowScroll, true);
    };
  }, []);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const sidebarClass = 'history-sidebar';
  const keyword = filter.trim().toLowerCase();
  const filteredHistory = useMemo(() => {
    if (!keyword) return history;
    return history.filter((entry) =>
      (entry.title || '未命名文章').toLowerCase().includes(keyword),
    );
  }, [history, keyword]);

  const hasEntries = filteredHistory.length > 0;

  return (
    <>
      <aside className={sidebarClass}>
        <div className="history-header">
          <h3>历史记录</h3>
          <div className="history-actions">
            <button className="btn-secondary btn-icon-only" onClick={handleCreateArticle} title="新增文章">
              <Plus size={16} />
            </button>
            <button
              className="btn-secondary btn-icon-only"
              onClick={async () => {
                if (confirm('确定要清空所有历史记录吗？')) {
                  await clearHistory();
                  resetDocument();
                }
              }}
              title="清空历史"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="history-search">
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="搜索..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <div className="history-empty">正在加载...</div>
        ) : !hasEntries ? (
          <div className="history-empty">
            {filter ? '无匹配结果' : '暂无记录'}
          </div>
        ) : (
          <div className="history-body">
            <div className="history-list">
              {filteredHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`history-item ${activeId === entry.id ? 'active' : ''}`}
                  onClick={() => handleRestore(entry)}
                >
                  <div className="history-item-main">
                    <div className="history-title-block">
                      <span className="history-time">{new Date(entry.savedAt).toLocaleString()}</span>
                      {renamingId === entry.id ? (
                        <div className="history-rename" onClick={(e) => e.stopPropagation()}>
                          <input
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            autoFocus
                          />
                          <button onClick={() => confirmRename(entry)}>确认</button>
                          <button onClick={() => setRenamingId(null)}>取消</button>
                        </div>
                      ) : (
                        <span className="history-title">{entry.title || '未命名文章'}</span>
                      )}
                      <span className="history-theme">{entry.themeName || '未命名主题'}</span>
                    </div>
                    <div className="history-actions-menu-wrapper">
                      <button
                        className="history-action-trigger"
                        onClick={(e) => handleMenuToggle(e, entry)}
                        aria-label="操作菜单"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
      {actionMenuId && menuEntry &&
        createPortal(
          <div
            className="history-action-menu"
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { copyTitle(menuEntry); closeActionMenu(); }}>
              <Copy size={14} />
              复制标题
            </button>
            <button onClick={() => { startRename(menuEntry); closeActionMenu(); }}>
              <Edit2 size={14} />
              重命名
            </button>
            <button className="danger" onClick={() => { handleDelete(menuEntry.id); closeActionMenu(); }}>
              <Trash2 size={14} />
              删除
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

function FileSystemHistory({ adapter }: { adapter: StorageAdapter }) {
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const setTheme = useEditorStore((state) => state.setTheme);
  const setThemeName = useEditorStore((state) => state.setThemeName);
  const setCustomCSS = useEditorStore((state) => state.setCustomCSS);
  const setFilePath = useEditorStore((state) => state.setFilePath);
  const [files, setFiles] = useState<StorageFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [saving, setSaving] = useState(false);

  const refreshFiles = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adapter.listFiles();
      setFiles(list);
      if (activePath && !list.find((item) => item.path === activePath)) {
        setActivePath(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('无法加载文件列表');
    } finally {
      setLoading(false);
    }
  }, [adapter, activePath]);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  const handleOpen = async (file: StorageFileItem) => {
    try {
      const content = await adapter.readFile(file.path);
      const parsed = parseFsFrontmatter(content);
      setMarkdown(parsed.body);
      setTheme(parsed.theme);
      setThemeName(parsed.themeName);
      setCustomCSS('');
      setFilePath(file.path);
      setActivePath(file.path);
      toast.success(`已打开: ${file.name}`);
    } catch (error) {
      console.error(error);
      toast.error('打开文件失败');
    }
  };

  const handleCreate = async () => {
    try {
      const fileName = `文稿-${Date.now()}.md`;
      await adapter.writeFile(fileName, defaultFsContent);
      await refreshFiles();
      await handleOpen({ path: fileName, name: fileName } as StorageFileItem);
    } catch (error) {
      console.error(error);
      toast.error('创建文件失败');
    }
  };

  const handleSave = async () => {
    if (!activePath) {
      toast('请先打开文件', { icon: 'ℹ️' });
      return;
    }
    try {
      setSaving(true);
      const { markdown, theme, themeName } = useEditorStore.getState();
      const frontmatter = `---
theme: ${theme}
themeName: ${themeName}
---
`;
      await adapter.writeFile(activePath, `${frontmatter}\n${markdown}`);
      toast.success('已保存当前文件');
      await refreshFiles();
    } catch (error) {
      console.error(error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (file: StorageFileItem) => {
    if (!confirm(`确定要删除 "${file.name}" 吗？`)) return;
    try {
      await adapter.deleteFile(file.path);
      toast.success('已删除文件');
      if (activePath === file.path) {
        setActivePath(null);
        setMarkdown('');
      }
      await refreshFiles();
    } catch (error) {
      console.error(error);
      toast.error('删除失败');
    }
  };

  const submitRename = async () => {
    if (!renamingPath || !renameValue.trim()) return;
    const nextName = renameValue.trim().endsWith('.md') ? renameValue.trim() : `${renameValue.trim()}.md`;
    try {
      await adapter.renameFile(renamingPath, nextName);
      toast.success('重命名成功');
      if (activePath === renamingPath) {
        setActivePath(nextName);
        setFilePath(nextName);
      }
      setRenamingPath(null);
      setRenameValue('');
      await refreshFiles();
    } catch (error) {
      console.error(error);
      toast.error('重命名失败');
    }
  };

  return (
    <aside className="history-sidebar">
      <div className="history-header">
        <h3>文件列表</h3>
        <div className="history-actions">
          <button className="btn-secondary btn-icon-only" onClick={handleCreate} title="新建文章">
            <Plus size={16} />
          </button>
          <button className="btn-secondary btn-icon-only" onClick={handleSave} disabled={!activePath || saving} title="保存当前">
            <Save size={16} />
          </button>
        </div>
      </div>
      <div className="history-body">
        {loading ? (
          <div className="history-empty">正在加载...</div>
        ) : files.length === 0 ? (
          <div className="history-empty">暂无文件</div>
        ) : (
          <div className="history-list">
            {files.map((file) => (
              <div
                key={file.path}
                className={`history-item ${activePath === file.path ? 'active' : ''}`}
                onClick={() => handleOpen(file)}
              >
                <div className="history-item-main">
                  <div className="history-title-block">
                    <span className="history-time">{formatDate(file.updatedAt)}</span>
                    {renamingPath === file.path ? (
                      <div className="history-rename" onClick={(e) => e.stopPropagation()}>
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename();
                            if (e.key === 'Escape') setRenamingPath(null);
                          }}
                          autoFocus
                        />
                        <button onClick={submitRename}>确认</button>
                        <button onClick={() => setRenamingPath(null)}>取消</button>
                      </div>
                    ) : (
                      <span className="history-title">{file.name}</span>
                    )}
                    <span className="history-theme">本地文件</span>
                  </div>
                  <div className="history-actions-menu-wrapper">
                    {renamingPath !== file.path && (
                      <>
                        <button
                          className="history-action-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingPath(file.path);
                            setRenameValue(file.name.replace(/\.md$/, ''));
                          }}
                          aria-label="重命名"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="history-action-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file);
                          }}
                          aria-label="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
