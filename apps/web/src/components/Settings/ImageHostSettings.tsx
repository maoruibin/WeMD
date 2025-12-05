import { useState, useEffect } from 'react';
import type { ImageHostConfig } from '../../services/image/ImageUploader';
import './ImageHostSettings.css';

interface AllConfigs {
    currentType: ImageHostConfig['type'];
    configs: {
        official?: any;
        qiniu?: any;
        aliyun?: any;
        tencent?: any;
    };
}

export function ImageHostSettings() {
    const [allConfigs, setAllConfigs] = useState<AllConfigs>(() => {
        const saved = localStorage.getItem('imageHostConfigs');
        return saved ? JSON.parse(saved) : { currentType: 'official', configs: {} };
    });

    const [testResult, setTestResult] = useState<string | null>(null);

    // 当前选中的配置
    const currentConfig: ImageHostConfig = {
        type: allConfigs.currentType,
        config: allConfigs.configs[allConfigs.currentType]
    };

    useEffect(() => {
        // 保存所有配置
        localStorage.setItem('imageHostConfigs', JSON.stringify(allConfigs));
        // 同时保存当前配置到旧的 key，保持兼容性
        localStorage.setItem('imageHostConfig', JSON.stringify(currentConfig));
    }, [allConfigs]);

    const handleTypeChange = (type: ImageHostConfig['type']) => {
        setAllConfigs(prev => ({
            ...prev,
            currentType: type
        }));
        setTestResult(null);
    };

    const handleConfigChange = (key: string, value: string) => {
        setAllConfigs(prev => ({
            ...prev,
            configs: {
                ...prev.configs,
                [prev.currentType]: {
                    ...prev.configs[prev.currentType],
                    [key]: value
                }
            }
        }));
    };

    const testConnection = async () => {
        setTestResult('测试中...');
        try {
            const { ImageHostManager } = await import('../../services/image/ImageUploader');
            const manager = new ImageHostManager(currentConfig);
            const valid = await manager.validate();
            setTestResult(valid ? '✅ 配置有效' : '❌ 配置无效');
        } catch (error) {
            setTestResult(`❌ ${error.message}`);
        }
    };

    return (
        <div className="image-host-settings">
            <div className="settings-layout">
                {/* 左侧：图床类型选择 */}
                <div className="host-type-selector">
                    <label>
                        <input
                            type="radio"
                            checked={currentConfig.type === 'official'}
                            onChange={() => handleTypeChange('official')}
                        />
                        <div className="host-option">
                            <strong>官方图床</strong>
                            <span>稳定快速，推荐使用</span>
                        </div>
                    </label>

                    <label>
                        <input
                            type="radio"
                            checked={currentConfig.type === 'qiniu'}
                            onChange={() => handleTypeChange('qiniu')}
                        />
                        <div className="host-option">
                            <strong>七牛云</strong>
                            <span>国内 CDN，稳定快速</span>
                        </div>
                    </label>

                    <label>
                        <input
                            type="radio"
                            checked={currentConfig.type === 'aliyun'}
                            onChange={() => handleTypeChange('aliyun')}
                        />
                        <div className="host-option">
                            <strong>阿里云 OSS</strong>
                            <span>阿里云对象存储，企业级稳定</span>
                        </div>
                    </label>

                    <label>
                        <input
                            type="radio"
                            checked={currentConfig.type === 'tencent'}
                            onChange={() => handleTypeChange('tencent')}
                        />
                        <div className="host-option">
                            <strong>腾讯云 COS</strong>
                            <span>腾讯云对象存储，高性能</span>
                        </div>
                    </label>
                </div>

                {/* 右侧：配置表单 */}
                <div className="host-config-panel">
                    {currentConfig.type === 'official' && (
                        <div className="config-empty">
                            <p>✅ 官方图床无需配置，直接可用</p>
                        </div>
                    )}

                    {currentConfig.type === 'qiniu' && (
                        <div className="host-config">
                            <div className="config-field">
                                <label>AccessKey</label>
                                <input
                                    type="text"
                                    placeholder="从七牛云控制台获取"
                                    value={currentConfig.config?.accessKey || ''}
                                    onChange={(e) => handleConfigChange('accessKey', e.target.value)}
                                />
                            </div>
                            <div className="config-field">
                                <label>SecretKey</label>
                                <input
                                    type="password"
                                    placeholder="从七牛云控制台获取"
                                    value={currentConfig.config?.secretKey || ''}
                                    onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                                />
                            </div>
                            <div className="config-field">
                                <label>存储空间名称（Bucket）</label>
                                <input
                                    type="text"
                                    placeholder="your-bucket"
                                    value={currentConfig.config?.bucket || ''}
                                    onChange={(e) => handleConfigChange('bucket', e.target.value)}
                                />
                            </div>
                            <div className="config-field">
                                <label>存储区域</label>
                                <select
                                    value={currentConfig.config?.region || 'z0'}
                                    onChange={(e) => handleConfigChange('region', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '14px',
                                        color: '#1e293b',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="z0">华东-浙江 (z0)</option>
                                    <option value="cn-east-2">华东-浙江2 (cn-east-2)</option>
                                    <option value="z1">华北-河北 (z1)</option>
                                    <option value="z2">华南-广东 (z2)</option>
                                    <option value="na0">北美-洛杉矶 (na0)</option>
                                    <option value="as0">亚太-新加坡 (as0)</option>
                                    <option value="ap-northeast-1">亚太-首尔 (ap-northeast-1)</option>
                                </select>
                            </div>
                            <div className="config-field">
                                <label>CDN 域名</label>
                                <input
                                    type="text"
                                    placeholder="https://xxx.clouddn.com（七牛云测试域名需加 http://）"
                                    value={currentConfig.config?.domain || ''}
                                    onChange={(e) => handleConfigChange('domain', e.target.value)}
                                />
                            </div>
                            <small>
                                <a href="https://portal.qiniu.com/kodo/bucket" target="_blank">七牛云控制台</a>
                            </small>
                            <button onClick={testConnection}>测试连接</button>
                            {testResult && <div className="test-result">{testResult}</div>}
                        </div>
                    )}

                    {currentConfig.type === 'aliyun' && (
                        <div className="host-config">
                            <div className="config-field">
                                <label>AccessKey ID</label>
                                <input
                                    type="text"
                                    placeholder="从阿里云控制台获取"
                                    value={currentConfig.config?.accessKeyId || ''}
                                    onChange={(e) => handleConfigChange('accessKeyId', e.target.value)}
                                />
                            </div>
                            <div className="config-field">
                                <label>AccessKey Secret</label>
                                <input
                                    type="password"
                                    placeholder="从阿里云控制台获取"
                                    value={currentConfig.config?.accessKeySecret || ''}
                                    onChange={(e) => handleConfigChange('accessKeySecret', e.target.value)}
                                />
                            </div>
                            <div className="config-field">
                                <label>Bucket 名称</label>
                                <input
                                    type="text"
                                    placeholder="your-bucket"
                                    value={currentConfig.config?.bucket || ''}
                                    onChange={(e) => handleConfigChange('bucket', e.target.value)}
                                />
                            </div>
                            <div className="config-field">
                                <label>地域节点</label>
                                <input
                                    type="text"
                                    placeholder="oss-cn-hangzhou"
                                    value={currentConfig.config?.region || ''}
                                    onChange={(e) => handleConfigChange('region', e.target.value)}
                                />
                                <small>例如：oss-cn-hangzhou（杭州）、oss-cn-beijing（北京）</small>
                            </div>
                            <div className="config-field">
                                <label>自定义域名（可选）</label>
                                <input
                                    type="text"
                                    placeholder="https://cdn.example.com"
                                    value={currentConfig.config?.endpoint || ''}
                                    onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                                />
                            </div>
                            <small>
                                <a href="https://oss.console.aliyun.com/bucket" target="_blank">阿里云 OSS 控制台</a>
                            </small>
                            <button onClick={testConnection}>测试连接</button>
                            {testResult && <div className="test-result">{testResult}</div>}
                        </div>
                    )}

                    {currentConfig.type === 'tencent' && (
                        <div className="host-config">
                            <div className="config-field">
                                <label>SecretId</label>
                                <input
                                    type="text"
                                    placeholder="从腾讯云控制台获取"
                                    value={currentConfig.config?.secretId || ''}
                                    onChange={(e) => handleConfigChange('secretId', e.target.value)}
                                />
                            </div>
                            <div className="config-field">
                                <label>SecretKey</label>
                                <input
                                    type="password"
                                    placeholder="从腾讯云控制台获取"
                                    value={currentConfig.config?.secretKey || ''}
                                    onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                                />
                            </div>
                            <div className="config-field">
                                <label>存储桶名称（Bucket）</label>
                                <input
                                    type="text"
                                    placeholder="your-bucket-1234567890"
                                    value={currentConfig.config?.bucket || ''}
                                    onChange={(e) => handleConfigChange('bucket', e.target.value)}
                                />
                                <small>格式：bucketname-appid</small>
                            </div>
                            <div className="config-field">
                                <label>所属地域</label>
                                <input
                                    type="text"
                                    placeholder="ap-guangzhou"
                                    value={currentConfig.config?.region || ''}
                                    onChange={(e) => handleConfigChange('region', e.target.value)}
                                />
                                <small>例如：ap-guangzhou（广州）、ap-beijing（北京）</small>
                            </div>
                            <div className="config-field">
                                <label>自定义域名（可选）</label>
                                <input
                                    type="text"
                                    placeholder="https://cdn.example.com"
                                    value={currentConfig.config?.endpoint || ''}
                                    onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                                />
                            </div>
                            <small>
                                <a href="https://console.cloud.tencent.com/cos" target="_blank">腾讯云 COS 控制台</a>
                            </small>
                            <button onClick={testConnection}>测试连接</button>
                            {testResult && <div className="test-result">{testResult}</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
