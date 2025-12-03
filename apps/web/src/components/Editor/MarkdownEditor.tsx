import { useEffect, useRef } from 'react';
import { EditorView, minimalSetup } from 'codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { githubLight } from '@uiw/codemirror-theme-github';
import { wechatMarkdownHighlighting } from './markdownTheme';
import { useEditorStore } from '../../store/editorStore';
import { useSettingsStore } from '../../store/settingsStore';
import { uploadImageToGitHub, uploadImageToLocal } from '../../services/imageUploader';
import { countWords, countLines } from '../../utils/wordCount';
import { Toolbar } from './Toolbar';
import toast from 'react-hot-toast';
import './MarkdownEditor.css';

const SYNC_SCROLL_EVENT = 'wemd-sync-scroll';

interface SyncScrollDetail {
    source: 'editor' | 'preview';
    ratio: number;
}

export function MarkdownEditor() {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const { markdown: content, setMarkdown } = useEditorStore();
    const workspaceDir = useEditorStore((state) => state.workspaceDir);
    const currentFilePath = useEditorStore((state) => state.currentFilePath);
    const setWorkspaceDir = useEditorStore((state) => state.setWorkspaceDir);
    const initialContent = useRef(content);
    const isSyncingRef = useRef(false);
    const isElectron = typeof window !== 'undefined' && !!(window as any).electron;

    useEffect(() => {
        if (!editorRef.current) return;

        const startState = EditorState.create({
            doc: initialContent.current,
            extensions: [
                minimalSetup,
                markdown({ base: markdownLanguage }),
                wechatMarkdownHighlighting,
                githubLight,
                EditorView.lineWrapping,
                EditorView.domEventHandlers({
                    paste: (event, view) => {
                        const items = event.clipboardData?.items;
                        if (!items) return;

                        for (const item of items) {
                            if (item.type.startsWith('image/')) {
                                event.preventDefault();
                                const file = item.getAsFile();
                                if (!file) continue;

                                const { imageHostingType, githubConfig, localConfig } = useSettingsStore.getState();

                                // 根据图床类型选择上传函数
                                let uploadPromise: Promise<{ url: string; filename: string }>;

                                if (imageHostingType === 'github') {
                                    if (!githubConfig.token || !githubConfig.repo) {
                                        toast.error('请先在设置中配置 GitHub 图床信息');
                                        return;
                                    }
                                    uploadPromise = uploadImageToGitHub(file, githubConfig);
                                } else {
                                    // local (includes COS via backend)
                                    uploadPromise = uploadImageToLocal(file, localConfig);
                                }

                                const loadingText = `![上传中... ${file.name}]()`;
                                const range = view.state.selection.main;
                                view.dispatch({
                                    changes: {
                                        from: range.from,
                                        to: range.to,
                                        insert: loadingText
                                    }
                                });

                                toast.promise(
                                    uploadPromise,
                                    {
                                        loading: '正在上传图片...',
                                        success: (result) => {
                                            const imageText = `![${result.filename}](${result.url})`;
                                            const currentDoc = view.state.doc.toString();
                                            const index = currentDoc.indexOf(loadingText);

                                            if (index !== -1) {
                                                view.dispatch({
                                                    changes: {
                                                        from: index,
                                                        to: index + loadingText.length,
                                                        insert: imageText
                                                    }
                                                });
                                            }
                                            return '图片上传成功';
                                        },
                                        error: (err) => {
                                            const currentDoc = view.state.doc.toString();
                                            const index = currentDoc.indexOf(loadingText);
                                            if (index !== -1) {
                                                view.dispatch({
                                                    changes: {
                                                        from: index,
                                                        to: index + loadingText.length,
                                                        insert: ''
                                                    }
                                                });
                                            }
                                            return `上传失败: ${err.message}`;
                                        }
                                    }
                                );
                            }
                        }
                    }
                }),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const newContent = update.state.doc.toString();
                        setMarkdown(newContent);
                    }
                }),
                EditorView.theme({
                    '&': {
                        height: '100%',
                        fontSize: '15px',
                    },
                    '.cm-scroller': {
                        fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
                        lineHeight: '1.6',
                    },
                    '.cm-content': {
                        padding: '16px',
                    },
                    '.cm-gutters': {
                        backgroundColor: '#f8f9fa',
                        border: 'none',
                    },
                }),
            ],
        });

        const view = new EditorView({
            state: startState,
            parent: editorRef.current,
        });

        const scrollDOM = view.scrollDOM;
        const handleEditorScroll = () => {
            if (isSyncingRef.current) {
                isSyncingRef.current = false;
                return;
            }
            const max = scrollDOM.scrollHeight - scrollDOM.clientHeight;
            if (max <= 0) return;
            const ratio = scrollDOM.scrollTop / max;
            window.dispatchEvent(new CustomEvent<SyncScrollDetail>(SYNC_SCROLL_EVENT, { detail: { source: 'editor', ratio } }));
        };

        const handleSync = (event: Event) => {
            const customEvent = event as CustomEvent<SyncScrollDetail>;
            const detail = customEvent.detail;
            if (!detail || detail.source === 'editor') return;
            const max = scrollDOM.scrollHeight - scrollDOM.clientHeight;
            if (max <= 0) return;
            isSyncingRef.current = true;
            scrollDOM.scrollTo({ top: detail.ratio * max });
        };

        scrollDOM.addEventListener('scroll', handleEditorScroll);
        window.addEventListener(SYNC_SCROLL_EVENT, handleSync as EventListener);

        viewRef.current = view;

        return () => {
            scrollDOM.removeEventListener('scroll', handleEditorScroll);
            window.removeEventListener(SYNC_SCROLL_EVENT, handleSync as EventListener);
            view.destroy();
        };
    }, [setMarkdown]);

    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const currentDoc = view.state.doc.toString();
        if (currentDoc === content) return;
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: content },
        });
    }, [content]);

    const wordCount = countWords(content);
    const lineCount = countLines(content);

    // Handle toolbar text insertion
    const handleInsert = (prefix: string, suffix: string, placeholder: string) => {
        const view = viewRef.current;
        if (!view) return;

        const selection = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(selection.from, selection.to);
        const textToInsert = selectedText || placeholder;
        const fullText = prefix + textToInsert + suffix;

        view.dispatch({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: fullText
            },
            selection: {
                anchor: selection.from + prefix.length,
                head: selection.from + prefix.length + textToInsert.length
            }
        });

        view.focus();
    };

    return (
        <div className="markdown-editor">
            <div className="editor-header">
                <span className="editor-title">Markdown 编辑器</span>
            </div>
            <Toolbar onInsert={handleInsert} />
            <div className="editor-body-wrapper">
                <div ref={editorRef} className="editor-container" />
            </div>
            <div className="editor-footer">
                <span className="editor-stat">行数: {lineCount}</span>
                <span className="editor-stat">字数: {wordCount}</span>
            </div>
        </div>
    );
}
