# 超级个体工作流程

> 从想法到发布的完整闭环（含 Claude Code Skills 使用指南）

---

## 🔄 完整流程图

```
💡 想法
   ↓
📝 记录到 backlog.md
   ↓
👀 周一评估排期
   ↓
📋 分配到版本 versions/vX.X.X/
   ↓
🎯 角色1：产品经理 → 01-product/prd.md
   ↓
🎨 角色2：UI设计师 → 02-design/ (含 prototype.html)
   ↓
🔧 角色3：技术工程师 → 03-dev/tech-design.md
   ↓
💻 开发实现 (周二-周四)
   ↓
🧪 测试验证
   ↓
🚀 发布 (周五)
   ↓
📢 各渠道公告
   ↓
📊 收集反馈 → 回到 backlog
```

---

## 🤖 Claude Code Skills 使用指南

本项目配备了一套 Claude Code Skills，可以自动化许多重复性工作。

### 📁 Skills 体系

```
~/.claude/skills/
└── project-workflow/                # 系统级（所有项目共享）
    ├── init-project-workflow        # 初始化项目文档体系
    └── new-version                 # 创建新版本

{项目}/.claude/skills/              # 项目级（当前项目专属）
    ├── new-feature                  # 创建新功能
    ├── write-prd                    # 编写 PRD
    ├── write-design                 # 编写 UI 设计
    ├── write-tech                   # 编写技术设计
    └── release                      # 发布版本
```

---

### 🌐 系统级 Skills

#### Skill 1: `/init-project-workflow` - 初始化项目文档体系

**用途**：在新项目中创建完整的文档管理体系

**触发方式**：
```
init-project-workflow
```

**执行内容**：
1. 询问项目配置（名称、版本、作者）
2. 创建完整目录结构（6大模块）
3. 创建所有核心文档（README、workflow、backlog 等）
4. 创建角色提示词（PM、设计师、工程师）
5. 创建文档模板（PRD、设计、技术等）

**使用场景**：
- 新建独立开发者项目
- 想规范化文档管理

---

#### Skill 2: `/new-version` - 创建新版本

**用途**：创建新版本目录

**触发方式**：
```
new-version v1.3.0
```

**执行内容**：
1. 创建 `versions/v1.3.0/` 目录
2. 创建 README.md（版本概述）
3. 创建 CHANGELOG.md（版本日志）
4. 更新根目录 CHANGELOG.md

---

### 📁 项目级 Skills

#### Skill 1: `/new-feature` - 创建新功能

**用途**：创建新功能的完整文档结构

**触发方式**：
```
new-feature 图片拖拽上传
new-feature feat-003 快捷键系统
```

**执行内容**：
1. 创建 `01-product/02-design/03-dev/` 目录
2. 复制对应模板文件
3. 创建功能 README.md
4. 询问是否立即编写 PRD

---

#### Skill 2: `/write-prd` - 编写 PRD

**用途**：扮演产品经理编写 PRD

**触发方式**：
```
write-prd 图片拖拽上传
write-prd feat-002
```

**执行内容**：
1. 读取角色提示词 `templates/roles/01-pm.md`
2. 读取产品文档（vision、values、persona）
3. 询问功能描述
4. 扮演产品经理编写 PRD
5. 输出到 `01-product/prd.md`

---

#### Skill 3: `/write-design` - 编写 UI 设计

**用途**：扮演 UI 设计师输出设计

**触发方式**：
```
write-design feat-002
```

**执行内容**：
1. 读取角色提示词 `templates/roles/02-designer.md`
2. 读取设计规范（colors、voice）
3. 探索现有组件
4. 扮演 UI 设计师
5. 输出：
   - `ui-design.md`（设计说明）
   - `prototype.html`（HTML 原型）

---

#### Skill 4: `/write-tech` - 编写技术设计

**用途**：扮演技术工程师输出技术方案

**触发方式**：
```
write-tech feat-002
```

**执行内容**：
1. 读取角色提示词 `templates/roles/03-engineer.md`
2. 读取技术文档（architecture、tech-stack）
3. **先探索代码库**（Grep/Glob）
4. 扮演技术工程师
5. 输出技术方案到 `03-dev/tech-design.md`

---

#### Skill 5: `/release` - 发布版本

**用途**：执行发布流程

**触发方式**：
```
release v1.2.0
```

**执行内容**：
1. 更新根目录 CHANGELOG.md
2. 更新版本 CHANGELOG.md
3. 生成 GitHub Release 内容
4. 生成公众号文章框架
5. 生成 Twitter 推文
6. 生成 V2EX 发帖内容

---

### 🚀 Skills 使用流程

#### 新项目

```
init-project-workflow
```

#### 开发新版本

```
new-version v1.3.0
new-feature 图片拖拽上传
write-prd 图片拖拽上传
write-design 图片拖拽上传
write-tech 图片拖拽上传
[开发...]
release v1.3.0
```

#### 快捷方式（连续执行）

```
new-feature 图片拖拽上传
write-prd 图片拖拽上传  ← 可直接继续
write-design 图片拖拽上传
write-tech 图片拖拽上传
```

---

### 📋 Skills 快速参考

| Skill | 触发词 | 输出 |
|-------|--------|------|
| init-project-workflow | 初始化项目文档体系 | 完整目录+模板 |
| new-version | 创建新版本 v1.3.0 | 版本目录+文件 |
| new-feature | 创建新功能 xxx | 功能目录+模板 |
| write-prd | 编写 PRD xxx | 01-product/prd.md |
| write-design | 编写 UI 设计 xxx | 02-design/ + HTML |
| write-tech | 编写技术设计 xxx | 03-dev/tech-design.md |
| release | 发布 v1.2.0 | CHANGELOG + 发布文案 |

---

### 💡 Tips

1. **批量操作**：多个 Skills 可以连续使用，Claude 会保持上下文
2. **灵活引用**：可以用功能名或功能编号（如 `feat-002`）
3. **确认机制**：重要操作前会询问确认
4. **自动探索**：`write-tech` 会先探索代码库再设计方案

---

## 📋 详细步骤

### 第一步：💡 捕获想法

**场景**：任何时候有想法

**操作**：
1. 打开 `backlog.md`
2. 在对应分类下添加记录
3. 简短描述即可

```markdown
### 灵魂火花
| 编号 | 想法 | 来源 | 日期 |
|------|------|------|------|
| ID-XXX | 支持XXX功能 | 用户反馈 | 2024-01-13 |
```

---

### 第二步：👀 周一评估

**场景**：每周一规划

**操作**：
1. 查看 `backlog.md`
2. 评估优先级 (P0/P1/P2/P3)
3. 决定放入哪个版本

```markdown
### P1 - 重要但不紧急
| 编号 | 功能 | 预期版本 |
|------|------|----------|
| FEAT-XXX | XXX功能 | v1.3.0 |
```

---

### 第三步：📋 创建功能目录 (使用 Skill)

**场景**：需求排期后

**方式一：手动创建**

```bash
mkdir -p docs/versions/v1.3.0/features/feat-XXX/{01-product,02-design/assets,03-dev}
```

**方式二：使用 Skill（推荐）**

```
new-feature 图片拖拽上传
```

Skill 会自动：
- 创建目录结构
- 复制模板文件
- 创建功能 README
- 询问是否继续编写 PRD

---

### 第四步：🎯 角色1 - 产品经理 (使用 Skill)

**场景**：编写 PRD

**方式一：手动编写**

打开 `01-product/prd.md`，参考 `templates/roles/01-pm.md`

**方式二：使用 Skill（推荐）**

```
write-prd 图片拖拽上传
```

Skill 会扮演产品经理：
- 读取角色提示词
- 读取产品文档（vision、values、persona）
- 询问功能描述
- 编写完整 PRD

---

### 第五步：🎨 角色2 - UI 设计师 (使用 Skill)

**场景**：输出 UI 设计

**方式一：手动编写**

打开 `02-design/ui-design.md`，参考 `templates/roles/02-designer.md`

**方式二：使用 Skill（推荐）**

```
write-design 图片拖拽上传
```

Skill 会扮演 UI 设计师：
- 读取角色提示词
- 读取设计规范（colors、voice）
- 探索现有组件
- 编写设计文档
- 输出 HTML 原型

---

### 第六步：🔧 角色3 - 技术工程师 (使用 Skill)

**场景**：输出技术方案

**方式一：手动编写**

打开 `03-dev/tech-design.md`，参考 `templates/roles/03-engineer.md`

**方式二：使用 Skill（推荐）**

```
write-tech 图片拖拽上传
```

Skill 会扮演技术工程师：
- 读取角色提示词
- 探索代码库（重要！）
- 编写技术方案
- 定义接口和任务

---

### 第七步：💻 开发实现

**场景**：周二-周四

**操作**：
1. 查看 `versions/v当前版本/` 下的需求
2. 按 PRD + UI 设计 + 技术设计开发
3. 提交代码

---

### 第八步：🧪 测试验证

**场景**：开发完成后

**检查清单**：
- [ ] 功能正常（PRD 验收标准）
- [ ] 边界情况处理
- [ ] 亮色/深色模式
- [ ] Web/桌面端

---

### 第九步：🚀 发布 (使用 Skill)

**场景**：周五

**方式一：手动发布**

查看清单：`04-marketing/releases/release-template.md`

**方式二：使用 Skill（推荐）**

```
release v1.2.0
```

Skill 会：
- 更新 CHANGELOG.md
- 生成所有发布文案
- 提供 Git tag 命令

---

### 第十步：📢 公告

**场景**：发布后

**操作**：
1. GitHub Release（引用 CHANGELOG）
2. 公众号文章（`templates/article-template.md`）
3. Twitter 推文（`templates/social-post-template.md`）
4. V2EX 发帖

---

### 第十一步：📊 收集反馈

**场景**：发布后持续

**操作**：
1. 查看 `05-community/feedback-sources.md`
2. 处理 GitHub Issues
3. 新问题记录到 `backlog.md`

---

## 🗓️ 一周日程

```
┌─────────────────────────────────────────────────────┐
│  周一：规划日                                        │
│  ├── 查看 backlog.md                                │
│  ├── 查看用户反馈                                    │
│  ├── 更新 roadmap.md                                │
│  └── 决定本周要做的需求                              │
├─────────────────────────────────────────────────────┤
│  周二-周四：开发日                                   │
│  ├── 使用 /new-feature 创建功能                      │
│  ├── 使用 /write-prd 编写 PRD                        │
│  ├── 使用 /write-design 输出设计                      │
│  ├── 使用 /write-tech 输出技术方案                   │
│  └── 按三件套开发（PRD+UI+技术）                      │
├─────────────────────────────────────────────────────┤
│  周五：发布日 (如果有版本要发布)                      │
│  ├── 测试验证                                        │
│  ├── 使用 /release 执行发布                          │
│  └── 各渠道公告                                      │
├─────────────────────────────────────────────────────┤
│  周末：运营日                                        │
│  ├── 写公众号文章                                    │
│  ├── 准备社媒内容                                    │
│  └── 分析数据                                        │
└─────────────────────────────────────────────────────┘
```

---

## 🎭 三大角色速查

| 角色 | 输出 | 提示词位置 | Skill |
|------|------|-----------|-------|
| 🎯 产品经理 | `01-product/prd.md` | `templates/roles/01-pm.md` | /write-prd |
| 🎨 UI 设计师 | `02-design/` + HTML 原型 | `templates/roles/02-designer.md` | /write-design |
| 🔧 技术工程师 | `03-dev/tech-design.md` | `templates/roles/03-engineer.md` | /write-tech |

---

## 🎯 快速参考

| 我想... | 使用 Skill | 去哪里 |
|---------|-----------|--------|
| 初始化新项目 | /init-project-workflow | 系统级 |
| 创建新版本 | /new-version v1.3.0 | 系统级 |
| 记录新想法 | - | `backlog.md` |
| 创建新功能 | /new-feature xxx | 项目级 |
| 编写 PRD | /write-prd xxx | 项目级 |
| 编写设计 | /write-design xxx | 项目级 |
| 编写技术 | /write-tech xxx | 项目级 |
| 发布版本 | /release v1.2.0 | 项目级 |
| 看当前版本要做什么 | - | `versions/` |
| 发布新版本 | - | `04-marketing/releases/release-template.md` |
| 写公众号文章 | - | `templates/article-template.md` |

---

## 📝 模板速查

| 需要写... | 使用模板 | 角色 |
|----------|----------|------|
| PRD | `templates/prd-template.md` | 产品经理 |
| UI 设计 | `templates/ui-design-template.md` | UI 设计师 |
| 技术设计 | `templates/tech-design-template.md` | 技术工程师 |
| Bug 报告 | `templates/bug-template.md` | - |
| 公众号文章 | `templates/article-template.md` | - |
| 社媒发布 | `templates/social-post-template.md` | - |

---

*更新于 2024-01-13 | 含 Skills 使用指南*
