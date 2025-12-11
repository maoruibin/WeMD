import { useState, useEffect, useRef, useCallback } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { X, ChevronUp, ChevronDown, Replace, CaseSensitive, Regex } from 'lucide-react';
import './SearchPanel.css';

interface SearchPanelProps {
    view: EditorView;
    onClose: () => void;
}

interface Match {
    from: number;
    to: number;
}

export function SearchPanel({ view, onClose }: SearchPanelProps) {
    const [searchText, setSearchText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [useRegexp, setUseRegexp] = useState(false);
    const [matches, setMatches] = useState<Match[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showReplace, setShowReplace] = useState(false);
    const [hasSearched, setHasSearched] = useState(false); // 是否已执行搜索
    const searchInputRef = useRef<HTMLInputElement>(null);

    // 聚焦搜索输入框
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // 执行搜索
    const doSearch = useCallback(() => {
        if (!searchText) {
            setMatches([]);
            setCurrentIndex(0);
            setHasSearched(false);
            return;
        }

        const doc = view.state.doc.toString();
        const foundMatches: Match[] = [];

        try {
            if (useRegexp) {
                const flags = caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(searchText, flags);
                let match;
                while ((match = regex.exec(doc)) !== null) {
                    foundMatches.push({ from: match.index, to: match.index + match[0].length });
                    if (foundMatches.length > 10000) break;
                }
            } else {
                const searchLower = caseSensitive ? searchText : searchText.toLowerCase();
                const docLower = caseSensitive ? doc : doc.toLowerCase();
                let pos = 0;
                while ((pos = docLower.indexOf(searchLower, pos)) !== -1) {
                    foundMatches.push({ from: pos, to: pos + searchText.length });
                    pos += searchText.length;
                    if (foundMatches.length > 10000) break;
                }
            }
        } catch {
            // 正则表达式错误，忽略
        }

        setMatches(foundMatches);
        setCurrentIndex(0);
        setHasSearched(true);

        // 跳转到第一个匹配项
        if (foundMatches.length > 0) {
            const match = foundMatches[0];
            view.dispatch({
                selection: EditorSelection.single(match.from, match.to),
                scrollIntoView: true,
            });
        }
    }, [searchText, caseSensitive, useRegexp, view]);

    // 高亮当前匹配项并滚动到视图
    useEffect(() => {
        if (hasSearched && matches.length > 0 && currentIndex >= 0 && currentIndex < matches.length) {
            const match = matches[currentIndex];
            view.dispatch({
                selection: EditorSelection.single(match.from, match.to),
                scrollIntoView: true,
            });
        }
    }, [currentIndex, matches, view, hasSearched]);

    const handleFindNext = () => {
        if (!hasSearched) {
            doSearch();
            return;
        }
        if (matches.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % matches.length);
    };

    const handleFindPrevious = () => {
        if (!hasSearched) {
            doSearch();
            return;
        }
        if (matches.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length);
    };

    const handleReplace = () => {
        if (matches.length === 0 || currentIndex < 0) return;
        const match = matches[currentIndex];

        view.dispatch({
            changes: { from: match.from, to: match.to, insert: replaceText },
        });

        // 重新搜索
        setTimeout(() => doSearch(), 0);
    };

    const handleReplaceAll = () => {
        if (matches.length === 0) return;

        const changes = [...matches].reverse().map((match) => ({
            from: match.from,
            to: match.to,
            insert: replaceText,
        }));

        view.dispatch({ changes });
        setMatches([]);
        setCurrentIndex(0);
        setHasSearched(false);
    };

    const handleClose = () => {
        onClose();
        view.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                handleFindPrevious();
            } else {
                handleFindNext();
            }
        }
    };

    // 输入变化时重置搜索状态
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
        setHasSearched(false); // 输入变化后需要重新按回车搜索
    };

    const matchCountText = () => {
        if (!searchText) return '';
        if (!hasSearched) return '按回车搜索';
        if (matches.length === 0) return '无匹配';
        return `${currentIndex + 1}/${matches.length}`;
    };

    return (
        <div className="search-panel" onKeyDown={handleKeyDown}>
            <div className="search-row">
                <div className="search-input-wrapper">
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="search-input"
                        placeholder="查找..."
                        value={searchText}
                        onChange={handleInputChange}
                    />
                    {searchText && <span className="match-count">{matchCountText()}</span>}
                </div>

                <div className="search-buttons">
                    <button
                        className={`search-option-btn ${caseSensitive ? 'active' : ''}`}
                        onClick={() => { setCaseSensitive(!caseSensitive); setHasSearched(false); }}
                        data-tooltip="区分大小写"
                    >
                        <CaseSensitive size={16} />
                    </button>
                    <button
                        className={`search-option-btn ${useRegexp ? 'active' : ''}`}
                        onClick={() => { setUseRegexp(!useRegexp); setHasSearched(false); }}
                        data-tooltip="使用正则表达式"
                    >
                        <Regex size={16} />
                    </button>
                    <div className="search-divider" />
                    <button
                        className="search-nav-btn"
                        onClick={handleFindPrevious}
                        data-tooltip="上一个 (Shift+Enter)"
                    >
                        <ChevronUp size={16} />
                    </button>
                    <button className="search-nav-btn" onClick={handleFindNext} data-tooltip="下一个 (Enter)">
                        <ChevronDown size={16} />
                    </button>
                    <div className="search-divider" />
                    <button
                        className={`search-option-btn ${showReplace ? 'active' : ''}`}
                        onClick={() => setShowReplace(!showReplace)}
                        data-tooltip="显示替换"
                    >
                        <Replace size={16} />
                    </button>
                    <button className="search-close-btn" onClick={handleClose} data-tooltip="关闭 (Esc)">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {showReplace && (
                <div className="replace-row">
                    <input
                        type="text"
                        className="search-input replace-input"
                        placeholder="替换为..."
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                    />
                    <div className="search-buttons">
                        <button
                            className="replace-btn"
                            onClick={handleReplace}
                            disabled={matches.length === 0}
                        >
                            替换
                        </button>
                        <button
                            className="replace-btn"
                            onClick={handleReplaceAll}
                            disabled={matches.length === 0}
                        >
                            全部替换
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
