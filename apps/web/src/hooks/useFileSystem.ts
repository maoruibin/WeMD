import { useEffect, useCallback, useRef } from 'react';
import { useFileStore } from '../store/fileStore';
import { useEditorStore } from '../store/editorStore';
import toast from 'react-hot-toast';

// Define Electron API type locally for safety
interface ElectronAPI {
    fs: {
        selectWorkspace: () => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
        setWorkspace: (dir: string) => Promise<{ success: boolean; path?: string }>;
        listFiles: (dir?: string) => Promise<{ success: boolean; files?: any[] }>;
        readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
        createFile: (payload: { filename?: string; content?: string }) => Promise<{ success: boolean; filePath?: string; filename?: string }>;
        saveFile: (payload: { filePath: string; content: string }) => Promise<{ success: boolean; error?: string }>;
        renameFile: (payload: { oldPath: string; newName: string }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
        deleteFile: (path: string) => Promise<{ success: boolean; error?: string }>;
        revealInFinder: (path: string) => Promise<void>;
        onRefresh: (cb: () => void) => any;
        removeRefreshListener: (handler: any) => void;
        onMenuNewFile: (cb: () => void) => any;
        onMenuSave: (cb: () => void) => any;
        onMenuSwitchWorkspace: (cb: () => void) => any;
        removeAllListeners: () => void;
    };
}

const getElectron = (): ElectronAPI | null => {
    // @ts-ignore
    return window.electron as ElectronAPI;
};

const WORKSPACE_KEY = 'wemd-workspace-path';

export function useFileSystem() {
    const electron = getElectron();
    const {
        workspacePath, files, currentFile, isLoading, isSaving,
        setWorkspacePath, setFiles, setCurrentFile, setLoading, setSaving
    } = useFileStore();

    const { setMarkdown, markdown } = useEditorStore();

    // Track last saved content to prevent unnecessary saves
    const lastSavedContent = useRef<string>('');
    // Track if content has been edited since opening the file
    const isDirty = useRef<boolean>(false);
    // Track if we're currently loading a file (to prevent auto-save during file switch)
    const isRestoring = useRef<boolean>(false);

    // 1. Load Workspace
    const loadWorkspace = useCallback(async (path: string) => {
        if (!electron) return;
        setLoading(true);
        try {
            const res = await electron.fs.setWorkspace(path);
            if (res.success) {
                setWorkspacePath(path);
                localStorage.setItem(WORKSPACE_KEY, path);
                await refreshFiles(path);
            } else {
                // If invalid, clear
                setWorkspacePath(null);
                localStorage.removeItem(WORKSPACE_KEY);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Refresh File List
    const refreshFiles = useCallback(async (dir?: string) => {
        if (!electron) return;
        const target = dir || workspacePath;
        if (!target) return;

        const res = await electron.fs.listFiles(target);
        if (res.success && res.files) {
            // Convert date strings to Date objects if needed
            const mapped = res.files.map((f: any) => ({
                ...f,
                createdAt: new Date(f.createdAt),
                updatedAt: new Date(f.updatedAt)
            }));
            setFiles(mapped);
        }
    }, [workspacePath]);

    // 3. Select Workspace (Dialog)
    const selectWorkspace = useCallback(async () => {
        if (!electron) return;
        const res = await electron.fs.selectWorkspace();
        if (res.success && res.path) {
            await loadWorkspace(res.path);
        }
    }, [loadWorkspace]);

    // 4. Open File
    const openFile = useCallback(async (file: any) => {
        if (!electron) return;

        isRestoring.current = true; // Mark as restoring to prevent auto-save

        const res = await electron.fs.readFile(file.path);
        if (res.success && typeof res.content === 'string') {
            setCurrentFile(file);

            // Parse Frontmatter
            const content = res.content;
            const match = content.match(/^---\n([\s\S]*?)\n---/);

            if (match) {
                const frontmatterRaw = match[1];
                const body = content.slice(match[0].length).trimStart();

                // Simple YAML parser for our needs
                const themeMatch = frontmatterRaw.match(/theme:\s*(.+)/);
                const themeNameMatch = frontmatterRaw.match(/themeName:\s*(.+)/);
                const cssMatch = frontmatterRaw.match(/customCSS:\s*\|([\s\S]*)/); // Multi-line support is tricky with regex, simplified for now

                const theme = themeMatch ? themeMatch[1].trim() : 'default';
                const themeName = themeNameMatch ? themeNameMatch[1].trim().replace(/^['"]|['"]$/g, '') : '默认主题';
                // Custom CSS parsing is complex with regex, skipping for now or need better parser

                setMarkdown(body);
                useEditorStore.getState().setTheme(theme);
                useEditorStore.getState().setThemeName(themeName);
                lastSavedContent.current = content; // Store full content with frontmatter
                isDirty.current = false; // Reset dirty flag
            } else {
                setMarkdown(content);
                // Reset to defaults if no frontmatter
                useEditorStore.getState().setTheme('default');
                useEditorStore.getState().setThemeName('默认主题');
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
    }, [setMarkdown]);

    // 5. Create File
    const createFile = useCallback(async () => {
        if (!electron || !workspacePath) return;
        const initialContent = '---\ntheme: default\nthemeName: 默认主题\n---\n\n# 新文章\n\n';
        const res = await electron.fs.createFile({ content: initialContent });
        if (res.success && res.filePath) {
            await refreshFiles();
            // Auto open the new file
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
    }, [workspacePath, refreshFiles, openFile]);

    // 6. Save File
    const saveFile = useCallback(async () => {
        if (!electron || !currentFile) return;
        setSaving(true);

        const { markdown, theme, themeName, customCSS } = useEditorStore.getState();

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
            return; // Skip save if no change
        }

        const res = await electron.fs.saveFile({ filePath: currentFile.path, content: fullContent });
        setSaving(false);

        if (res.success) {
            lastSavedContent.current = fullContent; // Update with full content including frontmatter
            // toast.success('已保存');
        } else {
            toast.error('保存失败: ' + res.error);
        }
    }, [currentFile]);

    // 7. Rename File
    const renameFile = useCallback(async (file: any, newName: string) => {
        if (!electron) return;
        const res = await electron.fs.renameFile({ oldPath: file.path, newName });
        if (res.success) {
            toast.success('重命名成功');
            await refreshFiles();
            // If renamed current file, update current file ref
            if (currentFile && currentFile.path === file.path) {
                setCurrentFile({ ...currentFile, path: res.filePath!, name: newName.endsWith('.md') ? newName : `${newName}.md` });
            }
        } else {
            toast.error(res.error || '重命名失败');
        }
    }, [refreshFiles, currentFile]);

    // 8. Delete File
    const deleteFile = useCallback(async (file: any) => {
        if (!electron) return;
        if (!confirm(`确定要删除 "${file.name}" 吗？`)) return;

        const res = await electron.fs.deleteFile(file.path);
        if (res.success) {
            toast.success('已删除');
            await refreshFiles();
            if (currentFile && currentFile.path === file.path) {
                setCurrentFile(null);
                setMarkdown(''); // Clear editor
            }
        } else {
            toast.error('删除失败');
        }
    }, [refreshFiles, currentFile, setMarkdown]);

    // --- Effects ---

    // Init: Load saved workspace
    useEffect(() => {
        const saved = localStorage.getItem(WORKSPACE_KEY);
        if (saved) {
            loadWorkspace(saved);
        }
    }, []);

    // Watcher Events
    useEffect(() => {
        if (!electron) return;
        const handler = electron.fs.onRefresh(() => {
            refreshFiles();
        });
        return () => electron.fs.removeRefreshListener(handler);
    }, [refreshFiles]);

    // Menu Events
    useEffect(() => {
        if (!electron) return;
        const newHandler = electron.fs.onMenuNewFile(() => createFile());
        const saveHandler = electron.fs.onMenuSave(() => saveFile());
        const switchHandler = electron.fs.onMenuSwitchWorkspace(() => selectWorkspace());

        return () => {
            // Cleanup is tricky with anonymous functions if not careful, 
            // but here we use the returned handler which is safe.
            // Actually preload exposes removeAllListeners too.
        };
    }, [createFile, saveFile, selectWorkspace]);

    // Auto Save - only when content is actually edited by user
    useEffect(() => {
        if (!currentFile || !markdown) return;

        // Skip if we're currently loading a file
        if (isRestoring.current) return;

        // Construct what would be saved (with frontmatter)
        const { theme, themeName } = useEditorStore.getState();
        const frontmatter = `---
theme: ${theme}
themeName: ${themeName}
---
`;
        const fullContent = frontmatter + '\n' + markdown;

        // Mark as dirty if full content differs from last saved
        if (fullContent !== lastSavedContent.current) {
            isDirty.current = true;
        }

        // Only set timer if content is dirty
        if (!isDirty.current) return;

        const timer = setTimeout(() => {
            if (isDirty.current && !isRestoring.current) {
                saveFile();
                isDirty.current = false;
            }
        }, 3000); // 3 seconds - reasonable balance between responsiveness and performance

        return () => clearTimeout(timer);
    }, [markdown, currentFile, saveFile]);

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
