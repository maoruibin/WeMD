import { useState, useEffect } from 'react';
import './FooterTemplateModal.css';

interface FooterConfig {
    templateId: 'centered' | 'card' | 'simple';
    title: string;
    tags: string;
    content: string;
}

interface FooterTemplateModalProps {
    onClose: () => void;
    onInsert: (html: string) => void;
}

export function FooterTemplateModal({ onClose, onInsert }: FooterTemplateModalProps) {
    const [config, setConfig] = useState<FooterConfig>({
        templateId: 'centered',
        title: '我是咕咚',
        tags: 'inBox 笔记 作者 | 独立开发者 | AI 编程实践者',
        content: '爱开发，爱分享。\n在这里，持续分享有价值的 AI 实践与开发感悟。\n关注我，一起探索 对话式编程 的实践与思考。'
    });

    useEffect(() => {
        const saved = localStorage.getItem('footerTemplateConfig');
        if (saved) {
            try {
                setConfig(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse footer config', e);
            }
        }
    }, []);

    const escapeHtml = (unsafe: string) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br/>");
    };

    const generateHtml = () => {
        const { title, tags, content } = config;
        const safeTitle = escapeHtml(title);
        const safeTags = escapeHtml(tags);
        const safeContent = escapeHtml(content);

        // 样式变量（针对微信公众号优化）
        const primaryColor = "#222";       // 主标题：接近黑色，更清晰
        const secondaryColor = "#888";     // 副标题：浅灰色，更明显
        const accentColor = "#ddd";

        switch (config.templateId) {
            case 'card':
                // 使用 section 标签 + 前后换行，确保 markdown-it 识别为块级元素
                return `\n\n<section style="margin: 40px 0 20px; padding: 24px; background: #f9f9f9; border: 1px solid #eee;"><div style="font-weight: bold; font-size: 18px; margin-bottom: 8px; color: ${primaryColor};">${safeTitle}</div><div style="font-size: 14px; color: ${secondaryColor}; margin-bottom: 16px; letter-spacing: 0.5px;">${safeTags}</div><div style="font-size: 15px; color: ${primaryColor}; line-height: 1.8;">${safeContent}</div></section>\n\n`;

            case 'simple':
                return `\n\n<section style="margin: 40px 0 20px; border-left: 4px solid ${primaryColor}; padding-left: 16px;"><div style="font-weight: bold; font-size: 17px; margin-bottom: 4px; color: ${primaryColor};">${safeTitle}</div>${safeTags ? `<div style="font-size: 14px; color: ${secondaryColor}; margin-bottom: 8px;">${safeTags}</div>` : ''}<div style="font-size: 14px; color: ${secondaryColor}; line-height: 1.6;">${safeContent}</div></section>\n\n`;

            case 'centered':
            default:
                const centeredTags = safeTags.split('|').map(tag => `<span style="margin: 0 4px;">${tag.trim()}</span>`).join('<span style="color: #ccc;">|</span>');
                return `\n\n<section style="text-align: center; margin: 40px 0 20px;"><div style="font-size: 18px; font-weight: bold; margin-bottom: 12px; color: ${primaryColor};">${safeTitle}</div><div style="font-size: 14px; color: ${secondaryColor}; margin-bottom: 24px; letter-spacing: 1px;">${centeredTags}</div><div style="width: 40px; height: 2px; background: ${accentColor}; margin: 0 auto 24px;"></div><div style="font-size: 15px; color: ${primaryColor}; line-height: 1.8; margin: 0; text-align: center;">${safeContent}</div></section>\n\n`;
        }
    };

    const handleSave = () => {
        localStorage.setItem('footerTemplateConfig', JSON.stringify(config));
        onInsert(generateHtml());
        onClose();
    };

    return (
        <div className="footer-template-modal-overlay" onClick={onClose}>
            <div className="footer-template-modal" onClick={e => e.stopPropagation()}>
                <div className="footer-template-header">
                    <h3>插入尾部模板</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="footer-template-body">
                    <div className="template-config">
                        <div className="config-section">
                            <h4>选择样式</h4>
                            <div className="template-grid">
                                <div 
                                    className={`template-option ${config.templateId === 'centered' ? 'active' : ''}`}
                                    onClick={() => setConfig({...config, templateId: 'centered'})}
                                >
                                    <div className="template-preview-icon" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                        <div style={{ width: '20px', height: '2px', background: 'currentColor' }}></div>
                                        <div style={{ width: '10px', height: '1px', background: 'currentColor' }}></div>
                                    </div>
                                    <span className="template-name">居中简约</span>
                                </div>
                                <div 
                                    className={`template-option ${config.templateId === 'card' ? 'active' : ''}`}
                                    onClick={() => setConfig({...config, templateId: 'card'})}
                                >
                                    <div className="template-preview-icon" style={{ border: '1px solid currentColor', padding: '4px' }}>
                                        <div style={{ width: '10px', height: '2px', background: 'currentColor', marginBottom: '2px' }}></div>
                                        <div style={{ width: '100%', height: '1px', background: 'currentColor', opacity: 0.5 }}></div>
                                    </div>
                                    <span className="template-name">卡片风格</span>
                                </div>
                                <div 
                                    className={`template-option ${config.templateId === 'simple' ? 'active' : ''}`}
                                    onClick={() => setConfig({...config, templateId: 'simple'})}
                                >
                                    <div className="template-preview-icon" style={{ borderLeft: '2px solid currentColor', paddingLeft: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ width: '15px', height: '2px', background: 'currentColor', marginBottom: '2px' }}></div>
                                        <div style={{ width: '20px', height: '1px', background: 'currentColor', opacity: 0.5 }}></div>
                                    </div>
                                    <span className="template-name">左侧引用</span>
                                </div>
                            </div>
                        </div>

                        <div className="config-section">
                            <h4>内容编辑</h4>
                            <div className="form-group">
                                <label>主标题</label>
                                <input 
                                    value={config.title}
                                    onChange={e => setConfig({...config, title: e.target.value})}
                                    placeholder="例如：我是咕咚"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>标签 / 副标题 {config.templateId === 'centered' ? '(用 | 分隔)' : ''}</label>
                                <input 
                                    value={config.tags}
                                    onChange={e => setConfig({...config, tags: e.target.value})}
                                    placeholder={config.templateId === 'centered' ? "标签1 | 标签2" : "副标题内容"}
                                />
                            </div>

                            <div className="form-group">
                                <label>正文内容</label>
                                <textarea 
                                    value={config.content}
                                    onChange={e => setConfig({...config, content: e.target.value})}
                                    placeholder="输入正文内容，支持换行"
                                    rows={6}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="template-preview-area">
                        <div className="preview-label">实时预览</div>
                        <div 
                            className="preview-container"
                            dangerouslySetInnerHTML={{ __html: generateHtml() }}
                        />
                    </div>
                </div>

                <div className="footer-template-footer">
                    <button className="btn-cancel" onClick={onClose}>取消</button>
                    <button className="btn-confirm" onClick={handleSave}>确认插入</button>
                </div>
            </div>
        </div>
    );
}
