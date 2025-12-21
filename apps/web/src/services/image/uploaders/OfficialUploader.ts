import type { ImageUploader } from '../ImageUploader';

interface OfficialConfig {
    serverUrl?: string;
    token?: string;
}

/**
 * 官方图床（通过 Cloudflare Worker 上传到 R2）
 */
export class OfficialUploader implements ImageUploader {
    name = '官方图床';
    private serverUrl: string;
    private token?: string;

    constructor(config?: OfficialConfig) {
        // 默认使用 Cloudflare Worker API
        this.serverUrl = config?.serverUrl || 'https://weimd-uploader.daxiagudong.workers.dev';
        this.token = config?.token;
    }

    configure(config: OfficialConfig) {
        if (config.serverUrl) {
            this.serverUrl = config.serverUrl;
        }
        if (config.token) {
            this.token = config.token;
        }
    }

    async validate(): Promise<boolean> {
        try {
            // 尝试发送 OPTIONS 请求检查连通性
            // 注意：需要 Worker 支持 OPTIONS 请求且正确配置 CORS
            const response = await fetch(`${this.serverUrl}/upload`, {
                method: 'OPTIONS',
            });
            // 只要能收到响应（哪怕是 405 Method Not Allowed），说明网络是通的
            return true;
        } catch (e) {
            console.error('Validate failed', e);
            return false;
        }
    }

    async upload(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        const headers: HeadersInit = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.serverUrl}/upload`, {
            method: 'POST',
            body: formData,
            headers: headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `上传失败: ${response.statusText}`);
        }

        if (!data.url) {
            throw new Error('服务器未返回图片地址');
        }

        return data.url;
    }
}
