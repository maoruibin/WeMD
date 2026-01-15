# 图床支持

WeiMD 支持多种图床服务，您可以根据需求选择最适合的方案。

## 支持的图床

| 图床 | 免费额度 | 配置难度 | 速度 | 推荐度 |
|------|---------|---------|------|--------|
| Base64 | 无限 | ⭐ | - | ⭐⭐⭐ 离线可用 |
| 官方图床 | 100MB | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ 最快 |
| SM.MS | 5GB | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ 国内快 |
| Imgur | 无限 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ 国外快 |
| GitHub | 1GB | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ 稳定 |
| 自定义 | 看服务商 | ⭐⭐⭐⭐ | 看服务商 | ⭐⭐⭐⭐⭐ 灵活 |

## 快速开始

### 1. Base64（默认）

无需配置，图片直接嵌入 Markdown 文档。

**优点**：
- ✅ 离线可用
- ✅ 无需配置
- ✅ 数据完全自主

**缺点**：
- ⚠️ 文件体积大
- ⚠️ 不适合大量图片

### 2. 官方图床（推荐）

**免费用户**：
- 100MB 总存储空间
- 无需注册

**付费用户**：
- 无限存储
- 更快的 CDN
- [购买 API Key](https://wemd.app/pricing)

**配置**：
```typescript
// 免费用户：无需配置
// 付费用户：在设置中输入 API Key
```

### 3. SM.MS

**获取 Token**：
1. 访问 [sm.ms](https://sm.ms)
2. 注册账号
3. 进入 [API Token](https://sm.ms/home/apitoken)
4. 生成 Token

**配置**：
```typescript
{
  type: 'smms',
  config: {
    token: 'your-token-here'
  }
}
```

### 4. Imgur

**获取 Client ID**：
1. 访问 [Imgur API](https://api.imgur.com/oauth2/addclient)
2. 注册应用（选择 "OAuth 2 authorization without a callback URL"）
3. 获取 Client ID

**配置**：
```typescript
{
  type: 'imgur',
  config: {
    clientId: 'your-client-id'
  }
}
```

### 5. GitHub

**获取 Token**：
1. 访问 [GitHub Settings](https://github.com/settings/tokens)
2. 生成 Personal Access Token
3. 勾选 `repo` 权限

**配置**：
```typescript
{
  type: 'github',
  config: {
    token: 'ghp_...',
    repo: 'username/repo-name',
    branch: 'main',  // 可选
    path: 'images'   // 可选
  }
}
```

### 6. 自定义图床

支持任意符合规范的图床 API。

**配置**：
```typescript
{
  type: 'custom',
  config: {
    endpoint: 'https://your-api.com/upload',
    headers: {
      'Authorization': 'Bearer your-token'
    },
    fieldName: 'file',  // 默认 'file'
    responseUrlPath: 'data.url'  // 响应中 URL 的路径
  }
}
```

**API 要求**：
- 接受 `multipart/form-data` POST 请求
- 返回 JSON 格式响应
- 响应中包含图片 URL

**示例响应**：
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/image.png"
  }
}
```

## 使用方法

### 在编辑器中使用

```typescript
import { ImageHostManager } from './services/image/ImageUploader';

// 获取配置
const config = JSON.parse(localStorage.getItem('imageHostConfig') || '{"type":"base64"}');

// 创建管理器
const manager = new ImageHostManager(config);

// 上传图片
async function handleImageUpload(file: File) {
  try {
    const url = await manager.upload(file);
    // 插入到编辑器
    insertMarkdown(`![](${url})`);
  } catch (error) {
    console.error('上传失败:', error);
  }
}
```

### 在设置中配置

```tsx
import { ImageHostSettings } from './components/Settings/ImageHostSettings';

function Settings() {
  return (
    <div>
      <ImageHostSettings />
    </div>
  );
}
```

## 常见问题

### Q: 如何选择图床？

**个人使用**：
- 偶尔用：Base64
- 经常用：官方图床（免费 100MB）
- 重度用：官方图床付费版

**团队使用**：
- 小团队：GitHub
- 大团队：自定义图床

### Q: Base64 和外链图床有什么区别？

**Base64**：
- 图片嵌入文档
- 文件体积大
- 离线可用

**外链图床**：
- 图片存储在服务器
- 文件体积小
- 需要网络访问

### Q: 如何迁移图床？

1. 导出所有文章
2. 使用脚本批量替换图片 URL
3. 重新导入

### Q: 图片上传失败怎么办？

1. 检查网络连接
2. 检查配置是否正确
3. 检查图床服务是否正常
4. 查看浏览器控制台错误信息

## 开发指南

### 添加新的图床支持

1. 创建 Uploader 类：

```typescript
// src/services/image/uploaders/MyUploader.ts
import type { ImageUploader } from '../ImageUploader';

export class MyUploader implements ImageUploader {
  name = 'My Image Host';
  
  async upload(file: File): Promise<string> {
    // 实现上传逻辑
    return 'https://example.com/image.png';
  }
}
```

2. 在 `ImageHostManager` 中注册：

```typescript
case 'my-host':
  return new MyUploader(config.config);
```

3. 在设置界面中添加选项。

## 许可证

MIT
