# 主题选择持久化技术设计

> **角色提示**：编写本文档时，请扮演 **技术工程师** 角色
> 详细角色说明请查看：[docs/templates/roles/03-engineer.md](../../../../../../templates/roles/03-engineer.md)

---

## 📋 元信息

| 项目 | 内容 |
|------|------|
| **技术文档编号** | FEAT-003-TECH |
| **编写日期** | 2025-01-14 |
| **工程师** | - |
| **关联 PRD** | [01-product/prd.md](../01-product/prd.md) |

---

## 🔍 问题分析

### 当前实现

文件：`apps/web/src/store/themeStore.ts`

已有代码：
- `saveSelectedTheme(themeId, themeName)` - 保存到 localStorage
- `loadSelectedTheme()` - 从 localStorage 加载
- `initialSelectedTheme` - 初始化时读取保存的主题
- `selectTheme()` - 选择主题时调用保存

### 问题定位

通过代码分析，可能的问题点：

1. **初始化时机问题**
   ```typescript
   // themeStore.ts:81-87
   const initialSelectedTheme = (() => {
       const saved = loadSelectedTheme();
       if (!saved) return null;
       const allThemes = [...builtInThemes, ...loadCustomThemes()];
       const exists = allThemes.some((t) => t.id === saved.id);
       return exists ? saved : null;
   })();
   ```
   - `initialSelectedTheme` 在模块加载时立即执行
   - Zustand store 创建时使用该值
   - 但后续可能有其他逻辑覆盖了这个初始值

2. **验证逻辑可能失败**
   - 如果 `builtInThemes` 数组顺序或 ID 发生变化
   - 验证 `exists` 可能返回 false

### 待调试确认

需要添加 console.log 或使用 debugger 确认：
- `initialSelectedTheme` 的实际值
- `loadSelectedTheme()` 是否成功返回
- 验证逻辑 `exists` 的结果

---

## 🛠️ 修复方案

### 方案一：优化初始化逻辑（推荐）

确保 Zustand store 的初始值正确设置：

```typescript
// themeStore.ts
export const useThemeStore = create<ThemeStore>((set, get) => {
    // 在 store 创建时加载
    const savedTheme = loadSelectedTheme();
    const allThemes = [...builtInThemes, ...loadCustomThemes()];
    const validSaved = savedTheme && allThemes.some((t) => t.id === savedTheme.id)
        ? savedTheme
        : { id: 'default', name: '默认主题' };

    return {
        themeId: validSaved.id,
        themeName: validSaved.name,
        // ... 其他初始化
    };
});
```

### 方案二：添加持久化中间件

使用 Zustand 的 persist 中间件自动处理持久化：

```typescript
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
    persist<ThemeStore>(
        (set, get) => ({
            // ... store 实现
        }),
        {
            name: 'wemd-theme-storage',
            partialize: (state) => ({
                themeId: state.themeId,
                themeName: state.themeName,
            }),
        }
    )
);
```

### 方案三：调试现有代码

先在现有代码中添加日志，确认问题点：

```typescript
const initialSelectedTheme = (() => {
    const saved = loadSelectedTheme();
    console.log('[ThemeStore] 加载保存的主题:', saved);
    if (!saved) {
        console.log('[ThemeStore] 无保存的主题，使用默认');
        return null;
    }
    const allThemes = [...builtInThemes, ...loadCustomThemes()];
    const exists = allThemes.some((t) => t.id === saved.id);
    console.log('[ThemeStore] 主题是否存在:', exists, '所有主题ID:', allThemes.map(t => t.id));
    return exists ? saved : null;
})();
```

---

## 📝 实施步骤

### 步骤 1：问题诊断
- [ ] 在 `themeStore.ts` 中添加调试日志
- [ ] 本地验证问题是否复现
- [ ] 确认具体是哪个环节出问题

### 步骤 2：修复实施
- [ ] 根据诊断结果选择合适的修复方案
- [ ] 修改 `themeStore.ts` 代码
- [ ] 确保边界情况正确处理

### 步骤 3：测试验证
- [ ] 选择主题 → 刷新 → 验证
- [ ] 选择主题 → 重启浏览器 → 验证
- [ ] 删除自定义主题 → 验证回退逻辑
- [ ] 隐私模式（localStorage 不可用）→ 验证默认行为

### 步骤 4：代码清理
- [ ] 移除调试日志
- [ ] 代码审查
- [ ] 提交代码

---

## 🧪 测试用例

| 用例编号 | 操作 | 预期结果 |
|----------|------|----------|
| TC-001 | 选择"黑白极简"主题，刷新页面 | 仍为"黑白极简" |
| TC-002 | 选择"学术论文"主题，重启浏览器 | 仍为"学术论文" |
| TC-003 | 选择自定义主题，删除该主题，刷新 | 恢复为默认主题 |
| TC-004 | 隐私模式下打开编辑器 | 正常使用默认主题 |

---

## 📊 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| localStorage 写入失败 | 无法保存主题 | try-catch 处理，静默失败 |
| 主题 ID 冲突 | 选中错误主题 | 验证主题存在性 |
| 旧版本数据格式不兼容 | 加载失败 | JSON.parse 增加容错 |

---

## 📝 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|----------|------|
| 2025-01-14 | 1.0 | 初始版本 | - |
