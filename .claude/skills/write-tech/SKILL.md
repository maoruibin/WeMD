---
name: write-tech
description: 编写技术设计文档。扮演技术工程师角色，根据 PRD 和 UI 设计编写技术方案。会先探索代码库（使用 Grep/Glob 查找相关组件、Store、服务），然后读取角色提示词 templates/roles/03-engineer.md 和技术文档，确保方案可行。输出包含架构图、接口定义、任务拆解和风险评估。
---

# 编写技术设计

扮演技术工程师角色，编写技术设计文档。

## 触发方式

```
/write-tech feat-002
/write-tech 图片拖拽上传
```

## 执行步骤

### 1. 确定目标功能

定位到功能目录，检查 PRD 和 UI 设计是否存在。

如果任一缺失，提示：
```
⚠️ 缺少必要文档
请确保已完成：
- PRD：/write-prd
- UI 设计：/write-design
```

### 2. 探索代码库

**重要**：在设计方案前，先探索现有代码库。

使用 Grep/Glob 查找：
- 相关组件：`apps/web/src/components/**/*关键词*`
- 相关 Store：`apps/web/src/store/*关键词*`
- 相关服务：`apps/web/src/services/**/*关键词*`

示例：
```bash
# 查找侧边栏相关组件
glob apps/web/src/components/**/*Sidebar*
glob apps/web/src/components/**/*sidebar*

# 搜索相关状态
grep -r "sidebar" apps/web/src/store/
```

### 3. 加载上下文

读取以下文件：

```
templates/roles/03-engineer.md         # 角色提示词
docs/02-dev/architecture.md            # 架构概览
docs/02-dev/tech-stack.md              # 技术栈
docs/02-dev/api.md                     # API 文档
features/{功能目录}/01-product/prd.md  # PRD
features/{功能目录}/02-design/ui-design.md  # UI 设计
```

### 4. 编写技术设计

扮演技术工程师，编写 `tech-design.md`，包含：

- 📋 元信息
- 🎯 方案概述（需求回顾、设计目标）
- 🏗️ 架构设计（整体架构、模块划分）
- 📦 技术选型（新增依赖、复用现有）
- 🔄 数据流设计（架构图/流程图、Store 变更）
- 🎨 组件设计（组件树、组件接口）
- 🧪 测试策略
- 🚀 实施计划（任务拆解、工时估算）
- ⚠️ 风险与应对

### 5. 输出文档

将编写好的技术设计写入 `features/{功能目录}/03-dev/tech-design.md`

### 6. 更新进度

更新功能 README.md 中的进度。

## 输出示例

```
✅ 技术设计已完成

文件：docs/versions/v1.2.0/features/feat-002/03-dev/tech-design.md

下一步：
- 开始开发实现
- 或继续添加其他功能
```

## 注意事项

- **先探索代码库再设计方案**
- 不要过度设计
- 考虑边界情况和错误处理
- 给出清晰的组件接口定义
- 估算开发工时
