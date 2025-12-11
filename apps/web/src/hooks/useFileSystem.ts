import { useEffect, useCallback, useRef } from 'react';
import { useFileStore } from '../store/fileStore';
import { useEditorStore } from '../store/editorStore';
import { useThemeStore } from '../store/themeStore';
import { useStorageContext } from '../storage/StorageContext';
import type { FileItem } from '../store/fileTypes';
import toast from 'react-hot-toast';

// Define Electron API type locally for safety
interface ElectronFileItem {
    name: string;
    path: string;
    createdAt: string;
    updatedAt: string;
    size?: number;
}

interface ElectronAPI {
    fs: {
        selectWorkspace: () => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
        setWorkspace: (dir: string) => Promise<{ success: boolean; path?: string }>;
        listFiles: (dir?: string) => Promise<{ success: boolean; files?: ElectronFileItem[] }>;
        readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
        createFile: (payload: { filename?: string; content?: string }) => Promise<{ success: boolean; filePath?: string; filename?: string }>;
        saveFile: (payload: { filePath: string; content: string }) => Promise<{ success: boolean; error?: string }>;
        renameFile: (payload: { oldPath: string; newName: string }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
        deleteFile: (path: string) => Promise<{ success: boolean; error?: string }>;
        revealInFinder: (path: string) => Promise<void>;
        onRefresh: (cb: () => void) => (() => void);
        removeRefreshListener: (handler: (() => void)) => void;
        onMenuNewFile: (cb: () => void) => (() => void);
        onMenuSave: (cb: () => void) => (() => void);
        onMenuSwitchWorkspace: (cb: () => void) => (() => void);
        removeAllListeners: () => void;
    };
}

const getElectron = (): ElectronAPI | null => {
    // @ts-expect-error - Electron API is injected at runtime
    return window.electron as ElectronAPI;
};

const WORKSPACE_KEY = 'wemd-workspace-path';
const LAST_FILE_KEY = 'wemd-last-file-path';

export function useFileSystem() {
    const { adapter, ready: storageReady, type: storageType } = useStorageContext();
    const electron = getElectron();

    const {
        workspacePath, files, currentFile, isLoading, isSaving,
        setWorkspacePath, setFiles, setCurrentFile, setLoading, setSaving
    } = useFileStore();

    const { setMarkdown, markdown } = useEditorStore();
    const { themeId: theme, themeName } = useThemeStore();

    // Track last saved content to prevent unnecessary saves
    const lastSavedContent = useRef<string>('');
    // Track if content has been edited since opening the file
    const isDirty = useRef<boolean>(false);
    // Track if we're currently loading a file (to prevent auto-save during file switch)
    const isRestoring = useRef<boolean>(false);

    // 1. Load Workspace
    const loadWorkspace = useCallback(async (path: string) => {
        if (electron) {
            setLoading(true);
            try {
                const res = await electron.fs.setWorkspace(path);
                if (res.success) {
                    setWorkspacePath(path);
                    localStorage.setItem(WORKSPACE_KEY, path);
                    await refreshFiles(path);
                } else {
                    setWorkspacePath(null);
                    localStorage.removeItem(WORKSPACE_KEY);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        } else {
            // Web mode: workspace is managed by adapter init
            setWorkspacePath(path); // For web, path is just a label or identifier
            await refreshFiles();
        }
    }, [electron]);

    // 2. Refresh File List
    const refreshFiles = useCallback(async (dir?: string) => {
        if (electron) {
            const target = dir || workspacePath;
            if (!target) return;

            const res = await electron.fs.listFiles(target);
            if (res.success && res.files) {
                const mapped = res.files.map((f) => ({
                    ...f,
                    size: f.size ?? 0,
                    createdAt: new Date(f.createdAt),
                    updatedAt: new Date(f.updatedAt)
                }));
                setFiles(mapped);
            }
        } else if (adapter && storageReady) {
            try {
                const files = await adapter.listFiles();
                // Adapter returns FileItem[], compatible with store
                setFiles(files.map(f => ({
                    name: f.name,
                    path: f.path,
                    size: f.size ?? 0,
                    createdAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
                    updatedAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
                    themeName: (f.meta?.themeName as string) || undefined
                })));
            } catch (error) {
                console.error('Failed to list files:', error);
                toast.error('无法加载文件列表');
            }
        }
    }, [workspacePath, electron, adapter, storageReady]);

    // 3. Select Workspace (Dialog)
    const selectWorkspace = useCallback(async () => {
        if (electron) {
            const res = await electron.fs.selectWorkspace();
            if (res.success && res.path) {
                await loadWorkspace(res.path);
            }
        } else {
            // Web mode: Trigger adapter selection via StorageContext (usually handled by UI)
            // But if we are here, it means user clicked folder icon
            // For FileSystem adapter, we might want to re-init
            toast('请在右上角"存储模式"中切换文件夹', { icon: 'ℹ️' });
        }
    }, [loadWorkspace, electron]);

    // 4. Open File
    const openFile = useCallback(async (file: FileItem) => {
        // 切换文件前保存当前文件的更改（包括主题）
        if (currentFile && isDirty.current && !isRestoring.current) {
            const { markdown: currentMarkdown } = useEditorStore.getState();
            const { themeId: currentTheme, themeName: currentThemeName } = useThemeStore.getState();
            const frontmatter = `---\ntheme: ${currentTheme}\nthemeName: ${currentThemeName}\n---\n`;
            const fullContent = frontmatter + '\n' + currentMarkdown;

            if (adapter && storageReady) {
                try {
                    await adapter.writeFile(currentFile.path, fullContent);
                    isDirty.current = false;
                    // 刷新文件列表以更新 themeName 显示
                    await refreshFiles();
                } catch (e) {
                    console.error('Failed to save before switch:', e);
                }
            }
        }

        isRestoring.current = true; // Mark as restoring to prevent auto-save

        let content = '';
        let success = false;

        if (electron) {
            const res = await electron.fs.readFile(file.path);
            if (res.success && typeof res.content === 'string') {
                content = res.content;
                success = true;
            }
        } else if (adapter && storageReady) {
            try {
                content = await adapter.readFile(file.path);
                success = true;
            } catch (error) {
                console.error('Read file error:', error);
            }
        }

        if (success) {
            setCurrentFile(file);

            // Parse Frontmatter
            const match = content.match(/^---\n([\s\S]*?)\n---/);

            if (match) {
                const frontmatterRaw = match[1];
                const body = content.slice(match[0].length).trimStart();

                // Simple YAML parser for our needs
                const themeMatch = frontmatterRaw.match(/theme:\s*(.+)/);
                const themeNameMatch = frontmatterRaw.match(/themeName:\s*(.+)/);

                const theme = themeMatch ? themeMatch[1].trim() : 'default';
                // themeName 暂不使用，selectTheme 会自动设置

                setMarkdown(body);
                useThemeStore.getState().selectTheme(theme);
                lastSavedContent.current = content; // Store full content with frontmatter
                isDirty.current = false; // Reset dirty flag
            } else {
                setMarkdown(content);
                // Reset to defaults if no frontmatter
                useThemeStore.getState().selectTheme('default');
                lastSavedContent.current = content; // Store full content
                isDirty.current = false; // Reset dirty flag
            }
        } else {
            toast.error('无法读取文件');
        }

        // Reset isRestoring after a short delay to allow state to settle
        setTimeout(() => {
            isRestoring.current = false;
        }, 100);

        // Save last opened file path to localStorage
        localStorage.setItem(LAST_FILE_KEY, file.path);
    }, [setMarkdown, electron, adapter, storageReady, currentFile, refreshFiles]);

    // 5. Create File
    const createFile = useCallback(async () => {
        const initialContent = '---\ntheme: default\nthemeName: 默认主题\n---\n\n# 新文章\n\n';

        if (electron) {
            if (!workspacePath) return;
            const res = await electron.fs.createFile({ content: initialContent });
            if (res.success && res.filePath) {
                await refreshFiles();
                const newFile = {
                    name: res.filename!,
                    path: res.filePath!,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    size: 0,
                    themeName: '默认主题'
                };
                await openFile(newFile);
                toast.success('已创建新文章');
            }
        } else if (adapter && storageReady) {
            const filename = `未命名文章-${Date.now()}.md`;
            try {
                await adapter.writeFile(filename, initialContent);
                await refreshFiles();
                const newFile = {
                    name: filename,
                    path: filename,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    size: initialContent.length,
                    themeName: '默认主题'
                };
                await openFile(newFile);
                toast.success('已创建新文章');
            } catch {
                toast.error('创建失败');
            }
        }
    }, [workspacePath, refreshFiles, openFile, electron, adapter, storageReady]);

    // 6. Save File
    const saveFile = useCallback(async (showToast = false) => {
        if (!currentFile) return;
        setSaving(true);

        const { markdown } = useEditorStore.getState();
        const { themeId: theme, themeName } = useThemeStore.getState();

        // Construct Frontmatter
        const frontmatter = `---
theme: ${theme}
themeName: ${themeName}
---
`;
        const fullContent = frontmatter + '\n' + markdown;

        // Check if content actually changed
        if (fullContent === lastSavedContent.current) {
            setSaving(false);
            if (showToast) toast.success('内容无变化');
            return; // Skip save if no change
        }

        let success = false;
        let errorMsg = '';

        if (electron) {
            const res = await electron.fs.saveFile({ filePath: currentFile.path, content: fullContent });
            if (res.success) success = true;
            else errorMsg = res.error || 'Unknown error';
        } else if (adapter && storageReady) {
            try {
                await adapter.writeFile(currentFile.path, fullContent);
                success = true;
            } catch (e: unknown) {
                errorMsg = e instanceof Error ? e.message : String(e);
            }
        }

        setSaving(false);

        if (success) {
            lastSavedContent.current = fullContent;
            if (showToast) toast.success('已保存');
        } else {
            toast.error('保存失败: ' + errorMsg);
        }
    }, [currentFile, electron, adapter, storageReady]);

    // 7. Rename File
    const renameFile = useCallback(async (file: FileItem, newName: string) => {
        const safeName = newName.endsWith('.md') ? newName : `${newName}.md`;

        if (electron) {
            const res = await electron.fs.renameFile({ oldPath: file.path, newName });
            if (res.success) {
                toast.success('重命名成功');
                await refreshFiles();
                if (currentFile && currentFile.path === file.path) {
                    setCurrentFile({ ...currentFile, path: res.filePath!, name: safeName });
                }
            } else {
                toast.error(res.error || '重命名失败');
            }
        } else if (adapter && storageReady) {
            try {
                await adapter.renameFile(file.path, safeName);
                toast.success('重命名成功');
                await refreshFiles();
                if (currentFile && currentFile.path === file.path) {
                    setCurrentFile({ ...currentFile, path: safeName, name: safeName });
                }
            } catch (error) {
                toast.error('重命名失败');
            }
        }
    }, [refreshFiles, currentFile, electron, adapter, storageReady]);

    // 8. Delete File
    const deleteFile = useCallback(async (file: FileItem) => {
        if (!confirm(`确定要删除 "${file.name}" 吗？`)) return;

        let success = false;

        if (electron) {
            const res = await electron.fs.deleteFile(file.path);
            success = res.success;
        } else if (adapter && storageReady) {
            try {
                await adapter.deleteFile(file.path);
                success = true;
            } catch (error) {
                console.error(error);
            }
        }

        if (success) {
            toast.success('已删除');
            await refreshFiles();
            if (currentFile && currentFile.path === file.path) {
                setCurrentFile(null);
                setMarkdown(''); // Clear editor
            }
        } else {
            toast.error('删除失败');
        }
    }, [refreshFiles, currentFile, setMarkdown, electron, adapter, storageReady]);

    // --- Effects ---


    // Init: Load saved workspace (Electron only)
    useEffect(() => {
        if (electron) {
            const saved = localStorage.getItem(WORKSPACE_KEY);
            if (saved) {
                loadWorkspace(saved);
            }
        } else {
            // Web: Reset state when storage type changes
            setCurrentFile(null);
            setMarkdown('');
            useThemeStore.getState().selectTheme('default');
            isDirty.current = false;
            lastSavedContent.current = '';

            if (storageReady && storageType === 'filesystem') {
                // Web: refresh files when storage is ready (only for filesystem mode)
                setLoading(true);
                (async () => {
                    try {
                        await refreshFiles();
                        // Auto-open last file or first file
                        const lastPath = localStorage.getItem(LAST_FILE_KEY);
                        const { files: currentFiles } = useFileStore.getState();
                        if (currentFiles.length > 0) {
                            const targetFile = lastPath
                                ? currentFiles.find(f => f.path === lastPath) || currentFiles[0]
                                : currentFiles[0];
                            if (targetFile) {
                                await openFile(targetFile);
                            }
                        }
                    } finally {
                        setLoading(false);
                    }
                })();
                // Set a virtual workspace path for UI display
                setWorkspacePath(storageType === 'filesystem' ? '本地文件夹' : '浏览器存储');
            } else if (storageReady && storageType === 'indexeddb') {
                // IndexedDB Mode: Clear workspace path
                setWorkspacePath('浏览器存储');
            }
        }
    }, [electron, storageReady, storageType]);

    // Watcher Events (Electron)
    useEffect(() => {
        if (!electron) return;
        const handler = electron.fs.onRefresh(() => {
            refreshFiles();
        });
        return () => electron.fs.removeRefreshListener(handler);
    }, [refreshFiles, electron]);

    // Menu Events (Electron)
    useEffect(() => {
        if (!electron) return;
        electron.fs.onMenuNewFile(() => createFile());
        electron.fs.onMenuSave(() => saveFile());
        electron.fs.onMenuSwitchWorkspace(() => selectWorkspace());

        return () => {
            // Cleanup
        };
    }, [createFile, saveFile, selectWorkspace, electron]);

    // Auto Save
    useEffect(() => {
        if (!currentFile || !markdown) return;
        if (isRestoring.current) return;

        const { themeId: theme, themeName } = useThemeStore.getState();
        const frontmatter = `---
theme: ${theme}
themeName: ${themeName}
---
`;
        const fullContent = frontmatter + '\n' + markdown;

        if (fullContent !== lastSavedContent.current) {
            isDirty.current = true;
        }

        if (!isDirty.current) return;

        const timer = setTimeout(() => {
            if (isDirty.current && !isRestoring.current) {
                saveFile();
                isDirty.current = false;
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [markdown, theme, themeName, currentFile, saveFile]);


    // Removed duplicate Cmd+S listener from here. 
    // It should be handled in App.tsx or a single top-level component.


    return {
        workspacePath,
        files,
        currentFile,
        isLoading,
        isSaving,
        selectWorkspace,
        openFile,
        createFile,
        saveFile,
        renameFile,
        deleteFile
    };
}
