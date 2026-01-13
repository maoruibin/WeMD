---
name: release
description: 发布版本。执行完整的发布流程，包括更新根目录 CHANGELOG.md、版本 CHANGELOG.md、生成 GitHub Release 内容、生成公众号文章框架、生成 Twitter 推文和 V2EX 发帖内容。按照发布清单 templates/roles/02-designer.md 和 04-marketing/releases/release-template.md 执行。
---

# 发布版本

执行版本发布流程，生成所有发布所需内容。

## 触发方式

```
/release v1.2.0
```

## 执行步骤

### 1. 确认版本

定位到版本目录，检查发布清单状态。

询问用户：
```
版本 v1.2.0 即将发布

检查清单状态：
- [ ] 代码开发完成
- [ ] 测试验证通过
- [ ] CHANGELOG 已更新

是否继续发布？
```

### 2. 加载上下文

读取以下文件：

```
docs/04-marketing/releases/release-template.md  # 发布清单模板
docs/templates/article-template.md             # 文章模板
docs/templates/social-post-template.md         # 社媒模板
docs/versions/{版本号}/CHANGELOG.md            # 版本日志
docs/01-product/changelog.md                   # 内部变更记录
```

读取版本目录下的所有功能，汇总变更内容。

### 3. 更新 CHANGELOG

更新根目录 `CHANGELOG.md`：

1. 将 `[Unreleased]` 的内容移动到新版本
2. 添加版本日期
3. 更新版本比较链接

### 4. 生成 GitHub Release

创建 GitHub Release 内容：

```markdown
## 🎉 WeMD v{版本号} 发布

### ✨ 新增
- [功能1]
- [功能2]

### ⚡ 优化
- [优化1]

### 🐛 修复
- [修复1]

### 📦 安装/升级

\`\`\`bash
pnpm install
pnpm dev:web
\`\`\`

### 📚 文档
- [官网](https://weimd.gudong.site)
- [文档](https://weimd.gudong.site/docs)

### 🙏 致谢
感谢所有贡献者！
```

### 5. 生成公众号文章

根据版本更新内容生成公众号文章框架：

```markdown
标题：WeMD v{版本号} 发布，[核心亮点]

开头：
简单介绍版本更新

正文：
- 新功能介绍
- 优化点说明
- 使用示例

结尾：
- 下载链接
- 反馈渠道
```

### 6. 生成社媒内容

**Twitter 推文**：
```
🚀 WeMD v{版本号} 发布！

✨ 新增：
- 功能1
- 功能2

下载：weimd.gudong.site

#WeMD #Markdown #公众号
```

**V2EX 发帖**：
```
标题：WeMD v{版本号} 发布，[核心亮点]

正文：
简介、更新内容、下载链接...
```

### 7. 创建 Git Tag

提供命令：
```bash
git tag v{版本号}
git push origin v{版本号}
```

### 8. 输出发布包

整理所有发布内容：

```markdown
## 📦 发布内容已生成

### ✅ 已更新
- CHANGELOG.md
- 版本 CHANGELOG.md

### 📝 待发布内容

**GitHub Release**：
[内容]

**公众号文章**：
[框架]

**Twitter 推文**：
[内容]

**V2EX 发帖**：
[内容]

### 🔖 Git Tag
```bash
git tag v{版本号}
git push origin v{版本号}
```

---

确认后执行发布？
```

## 注意事项

- 发布前确认所有检查项完成
- 版本号格式正确（vX.Y.Z）
- CHANGELOG 格式符合 Keep a Changelog 标准
- 所有链接有效
