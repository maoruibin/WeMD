import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore, defaultMarkdown } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';

const AUTO_SAVE_INTERVAL = 10 * 1000; // 10 seconds - better balance for web storage
const UNTITLED_TITLE = '未命名文章';

function deriveTitle(markdown: string) {
  const trimmed = markdown.trim();
  if (!trimmed) return UNTITLED_TITLE;
  const headingMatch = trimmed.match(/^(#+)\s*(.+)$/m);
  if (headingMatch) {
    return headingMatch[2].trim().slice(0, 50) || UNTITLED_TITLE;
  }
  const firstLine = trimmed.split(/\r?\n/).find((line) => line.trim());
  return firstLine ? firstLine.trim().slice(0, 50) : UNTITLED_TITLE;
}

export function HistoryManager() {
  const markdown = useEditorStore((state) => state.markdown);
  const theme = useEditorStore((state) => state.theme);
  const customCSS = useEditorStore((state) => state.customCSS);
  const themeName = useEditorStore((state) => state.themeName);
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const setTheme = useEditorStore((state) => state.setTheme);
  const setCustomCSS = useEditorStore((state) => state.setCustomCSS);
  const setThemeName = useEditorStore((state) => state.setThemeName);
  const setFilePath = useEditorStore((state) => state.setFilePath);
  const setWorkspaceDir = useEditorStore((state) => state.setWorkspaceDir);

  const persistActiveSnapshot = useHistoryStore((state) => state.persistActiveSnapshot);
  const saveSnapshot = useHistoryStore((state) => state.saveSnapshot);
  const loadHistory = useHistoryStore((state) => state.loadHistory);
  const history = useHistoryStore((state) => state.history);
  const activeId = useHistoryStore((state) => state.activeId);
  const setActiveId = useHistoryStore((state) => state.setActiveId);
  const loading = useHistoryStore((state) => state.loading);

  const latestRef = useRef({ markdown, theme, customCSS, themeName });
  const prevMarkdownRef = useRef(markdown);
  const isInitialMountRef = useRef(true);
  const isRestoringRef = useRef(false);
  const hasUserEditedRef = useRef(false);
  const hasAppliedInitialHistoryRef = useRef(false);
  const creatingInitialSnapshotRef = useRef(false);
  const hasLoadedHistoryRef = useRef(false);
  const wasLoadingRef = useRef(false);
  const restoringContentRef = useRef<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Track loading lifecycle
  useEffect(() => {
    if (loading) {
      wasLoadingRef.current = true;
    } else if (wasLoadingRef.current) {
      hasLoadedHistoryRef.current = true;
    }
  }, [loading]);

  useEffect(() => {
    latestRef.current = { markdown, theme, customCSS, themeName };

    const markdownChanged = markdown !== prevMarkdownRef.current;
    prevMarkdownRef.current = markdown;

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Check if this change matches the content we are restoring
    if (restoringContentRef.current !== null && markdown === restoringContentRef.current) {
      console.log('[History] Content matched restoring content, skipping edit mark');
      restoringContentRef.current = null; // Reset
      return; // Skip marking as edited
    }

    // Only mark as edited if:
    // 1. Markdown actually changed
    // 2. We are not restoring (legacy check, keep for safety)
    // 3. We are not loading
    // 4. History has finished loading at least once
    if (markdownChanged && !isRestoringRef.current && !loading && hasLoadedHistoryRef.current) {
      console.log('[History] User edit detected:', { markdownChanged, isRestoring: isRestoringRef.current, loading, hasLoadedHistory: hasLoadedHistoryRef.current });
      hasUserEditedRef.current = true;
    }

    if (creatingInitialSnapshotRef.current) return;

    const { activeId: currentActiveId, history: currentHistory, loading: storeLoading } = useHistoryStore.getState();
    if (storeLoading) return;

    if (!currentActiveId && currentHistory.length === 0 && markdown.trim()) {
      console.log('[History] Creating initial snapshot');
      creatingInitialSnapshotRef.current = true;
      void saveSnapshot(
        {
          markdown,
          theme,
          customCSS,
          title: deriveTitle(markdown),
          themeName,
        },
        { force: true },
      ).finally(() => {
        creatingInitialSnapshotRef.current = false;
      });
    }
  }, [markdown, theme, customCSS, themeName, saveSnapshot]);

  const persistLatestSnapshot = useCallback(async () => {
    const snapshot = latestRef.current;
    if (!snapshot.markdown.trim()) return;

    // Prevent auto-save if user hasn't edited or if we are currently restoring history
    if (!hasUserEditedRef.current || isRestoringRef.current) {
      // console.log('[History] Skipping auto-save:', { hasUserEdited: hasUserEditedRef.current, isRestoring: isRestoringRef.current });
      return;
    }

    const { activeId: currentActiveId, history: currentHistory, loading: storeLoading } = useHistoryStore.getState();
    if (storeLoading) return;

    console.log('[History] Auto-saving...', { activeId: currentActiveId });

    if (!currentActiveId) {
      if (currentHistory.length === 0) {
        await saveSnapshot(
          {
            markdown: snapshot.markdown,
            theme: snapshot.theme,
            customCSS: snapshot.customCSS,
            title: deriveTitle(snapshot.markdown),
            themeName: snapshot.themeName,
          },
          { force: true },
        );
      }
      return;
    }

    await persistActiveSnapshot({
      markdown: snapshot.markdown,
      theme: snapshot.theme,
      customCSS: snapshot.customCSS,
      themeName: snapshot.themeName,
    });
  }, [persistActiveSnapshot, saveSnapshot]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void persistLatestSnapshot();
    }, AUTO_SAVE_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [persistLatestSnapshot]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      void persistLatestSnapshot();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [persistLatestSnapshot]);

  useEffect(() => {
    if (!history.length) {
      hasAppliedInitialHistoryRef.current = false;
      return;
    }
    const candidateEntry = history.find((entry) => entry.id === activeId) ?? history[0];
    if (!candidateEntry) return;

    const latest = latestRef.current;
    const matchesLatest =
      latest.markdown === candidateEntry.markdown &&
      latest.theme === candidateEntry.theme &&
      latest.customCSS === candidateEntry.customCSS &&
      latest.themeName === candidateEntry.themeName;

    const isInitialRun = !hasAppliedInitialHistoryRef.current;
    const shouldSkipApply = isInitialRun && hasUserEditedRef.current;

    if (shouldSkipApply) {
      hasAppliedInitialHistoryRef.current = true;
      return;
    }

    if (matchesLatest) {
      if (candidateEntry.id !== activeId) {
        setActiveId(candidateEntry.id);
      }
      hasAppliedInitialHistoryRef.current = true;
      return;
    }

    if (candidateEntry.id !== activeId) {
      setActiveId(candidateEntry.id);
    }

    console.log('[History] Restoring content:', candidateEntry.id);
    isRestoringRef.current = true;
    restoringContentRef.current = candidateEntry.markdown; // Set expected content
    setMarkdown(candidateEntry.markdown);
    setTheme(candidateEntry.theme);
    setCustomCSS(candidateEntry.customCSS);
    if (candidateEntry.themeName) {
      setThemeName(candidateEntry.themeName);
    }
    setFilePath(candidateEntry.filePath);
    if (candidateEntry.filePath) {
      const last = Math.max(candidateEntry.filePath.lastIndexOf('/'), candidateEntry.filePath.lastIndexOf('\\'));
      if (last >= 0) {
        const dir = candidateEntry.filePath.slice(0, last);
        if (dir) {
          setWorkspaceDir(dir);
        }
      }
    }
    latestRef.current = {
      markdown: candidateEntry.markdown,
      theme: candidateEntry.theme,
      customCSS: candidateEntry.customCSS,
      themeName: candidateEntry.themeName,
    };
    hasUserEditedRef.current = false;
    isRestoringRef.current = false;
    hasAppliedInitialHistoryRef.current = true;
  }, [history, activeId, setActiveId, setMarkdown, setTheme, setCustomCSS, setThemeName]);

  return null;
}
