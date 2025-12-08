import { create } from 'zustand';
import {
  basicTheme,
  customDefaultTheme,
  codeGithubTheme,
  academicPaperTheme,
  auroraGlassTheme,
  bauhausTheme,
  cyberpunkNeonTheme,
  knowledgeBaseTheme,
  luxuryGoldTheme,
  morandiForestTheme,
  neoBrutalismTheme,
  receiptTheme,
  sunsetFilmTheme,
  templateTheme
} from '@wemd/core';

export interface ResetOptions {
  markdown?: string;
  theme?: string;
  customCSS?: string;
  themeName?: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  css: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  css: string;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditorStore {
  markdown: string;
  setMarkdown: (markdown: string) => void;

  theme: string;
  setTheme: (theme: string) => void;
  themeName: string;
  setThemeName: (name: string) => void;
  themes: ThemeDefinition[];
  setThemes: (themes: ThemeDefinition[]) => void;
  selectTheme: (themeId: string) => void;

  customCSS: string;
  setCustomCSS: (css: string) => void;
  getThemeCSS: (theme: string) => string;

  // Custom theme management
  customThemes: CustomTheme[];
  getAllThemes: () => CustomTheme[];
  createTheme: (name: string, css?: string) => CustomTheme;
  updateTheme: (id: string, updates: Partial<Pick<CustomTheme, 'name' | 'css'>>) => void;
  deleteTheme: (id: string) => void;
  duplicateTheme: (id: string, newName: string) => CustomTheme;

  resetDocument: (options?: ResetOptions) => void;
  copyToWechat: () => void;

  currentFilePath?: string;
  workspaceDir?: string;
  setFilePath: (path?: string) => void;
  setWorkspaceDir: (dir?: string) => void;
}

export const defaultMarkdown = `# 欢迎使用 WeMD

这是一个现代化的 Markdown 编辑器，专为**微信公众号**排版设计。

## 1. 基础语法
**这是加粗文本**

*这是斜体文本*

***这是加粗斜体文本***

~~这是删除线文本~~

==这是高亮文本==

这是一个 [链接](https://github.com/your-repo)

## 2. 特殊格式
### 上标和下标

水的化学式：H~2~O

爱因斯坦质能方程：E=mc^2^

### Emoji 表情
今天天气真好 :sunny: 

让我们一起学习 :books: 

加油 :rocket:

## 3. 列表展示
### 无序列表
- 列表项 1
- 列表项 2
  - 子列表项 2.1
  - 子列表项 2.2

### 有序列表
1. 第一步
2. 第二步
3. 第三步

## 4. 引用
> 这是一个一级引用
> 
> > 这是一个二级引用
> > 
> > > 这是一个三级引用
> 

::: tip
这是一个技巧提示块 (Tip)
:::

::: note
这是一个提示块 (Note)
:::

::: info
这是一个信息提示块 (Info)
:::

::: success
这是一个成功提示块 (Success)
:::

::: warning
这是一个警告提示块 (Warning)
:::

::: danger
这是一个危险提示块 (Danger)
:::

## 5. 代码展示
### 行内代码
我们在代码中通常使用 \`console.log()\` 来输出信息。

### 代码块
\`\`\`javascript
// JavaScript 示例
function hello() {
  console.log('Hello, WeMD!');
  const a = 1;
  const b = 2;
  return a + b;
}
\`\`\`

## 6. 数学公式
行内公式: $E=mc^2$

行间公式:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## 7. 表格
| 姓名 | 年龄 | 职业 |
| :--- | :---: | ---: |
| 张三 | 18 | 工程师 |
| 李四 | 20 | 设计师 |
| 王五 | 22 | 产品经理 |

## 8. 分割线
---

## 9. 图片
![WeMD](https://img.wemd.app/favicon-dark.png)

**开始编辑吧!** 🚀
`;

// LocalStorage key for custom themes
const CUSTOM_THEMES_KEY = 'wemd-custom-themes';

const canUseLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Load custom themes from localStorage
const loadCustomThemes = (): CustomTheme[] => {
  if (!canUseLocalStorage()) {
    return [];
  }
  try {
    const stored = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load custom themes:', error);
    return [];
  }
};

// Save custom themes to localStorage
const saveCustomThemes = (themes: CustomTheme[]): void => {
  if (!canUseLocalStorage()) {
    return;
  }
  try {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  } catch (error) {
    console.error('Failed to save custom themes:', error);
  }
};

// Built-in themes converted to CustomTheme format
const builtInThemes: CustomTheme[] = [
  {
    id: 'default',
    name: '默认主题',
    css: basicTheme + '\n' + customDefaultTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'academic-paper',
    name: '学术论文',
    css: basicTheme + '\n' + academicPaperTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'aurora-glass',
    name: '极光玻璃',
    css: basicTheme + '\n' + auroraGlassTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bauhaus',
    name: '包豪斯',
    css: basicTheme + '\n' + bauhausTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cyberpunk-neon',
    name: '赛博朋克',
    css: basicTheme + '\n' + cyberpunkNeonTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'knowledge-base',
    name: '知识库',
    css: basicTheme + '\n' + knowledgeBaseTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'luxury-gold',
    name: '黑金奢华',
    css: basicTheme + '\n' + luxuryGoldTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'morandi-forest',
    name: '莫兰迪森林',
    css: basicTheme + '\n' + morandiForestTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'neo-brutalism',
    name: '新粗野主义',
    css: basicTheme + '\n' + neoBrutalismTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'receipt',
    name: '购物小票',
    css: basicTheme + '\n' + receiptTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sunset-film',
    name: '落日胶片',
    css: basicTheme + '\n' + sunsetFilmTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template',
    name: '主题模板',
    css: basicTheme + '\n' + templateTheme + '\n' + codeGithubTheme,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Legacy format for backward compatibility
const defaultThemes: ThemeDefinition[] = [
  {
    id: 'default',
    name: '默认主题',
    css: basicTheme + '\n' + customDefaultTheme + '\n' + codeGithubTheme,
  },
];

export const useEditorStore = create<EditorStore>((set, get) => ({
  markdown: defaultMarkdown,
  setMarkdown: (markdown) => set({ markdown }),

  theme: 'default',
  setTheme: (theme) => set({ theme }),
  themeName: '默认主题',
  setThemeName: (themeName: string) => set({ themeName }),
  themes: defaultThemes,
  setThemes: (themes) => set({ themes }),
  selectTheme: (themeId: string) => {
    const allThemes = get().getAllThemes();
    const theme = allThemes.find((item) => item.id === themeId);
    if (!theme) return;
    set({
      theme: theme.id,
      themeName: theme.name,
      customCSS: '',
    });
  },

  customCSS: '',
  setCustomCSS: (css) => set({ customCSS: css }),

  getThemeCSS: (theme: string) => {
    const state = get();
    const allThemes = state.getAllThemes();
    const definition = allThemes.find((item) => item.id === theme);

    if (definition) {
      // If there's custom CSS override, append it to the theme CSS
      if (state.customCSS) {
        return definition.css + '\n' + state.customCSS;
      }
      return definition.css;
    }

    // Fallback to default theme
    return builtInThemes[0].css;
  },

  // Custom theme management
  customThemes: loadCustomThemes(),

  getAllThemes: () => {
    const state = get();
    return [...builtInThemes, ...state.customThemes];
  },

  createTheme: (name: string, css?: string) => {
    const state = get();
    const trimmedName = name.trim() || '未命名主题';
    const themeCSS = css || state.customCSS || state.getThemeCSS(state.theme);

    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      css: themeCSS,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextCustomThemes = [...state.customThemes, newTheme];
    saveCustomThemes(nextCustomThemes);
    set({ customThemes: nextCustomThemes });

    return newTheme;
  },

  updateTheme: (id: string, updates: Partial<Pick<CustomTheme, 'name' | 'css'>>) => {
    const state = get();
    const themeIndex = state.customThemes.findIndex((t) => t.id === id);

    if (themeIndex === -1) {
      console.warn(`Theme ${id} not found or is built-in`);
      return;
    }

    const updatedTheme: CustomTheme = {
      ...state.customThemes[themeIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const nextCustomThemes = [
      ...state.customThemes.slice(0, themeIndex),
      updatedTheme,
      ...state.customThemes.slice(themeIndex + 1),
    ];

    saveCustomThemes(nextCustomThemes);
    set({ customThemes: nextCustomThemes });

    // Update current theme name if this is the active theme
    if (state.theme === id) {
      set({ themeName: updatedTheme.name });
    }
  },

  deleteTheme: (id: string) => {
    const state = get();
    const theme = state.customThemes.find((t) => t.id === id);

    if (!theme) {
      console.warn(`Theme ${id} not found or is built-in`);
      return;
    }

    const nextCustomThemes = state.customThemes.filter((t) => t.id !== id);
    saveCustomThemes(nextCustomThemes);
    set({ customThemes: nextCustomThemes });

    // If the deleted theme was active, switch to default
    if (state.theme === id) {
      set({
        theme: 'default',
        themeName: '默认主题',
        customCSS: '',
      });
    }
  },

  duplicateTheme: (id: string, newName: string) => {
    const state = get();
    const allThemes = state.getAllThemes();
    const sourceTheme = allThemes.find((t) => t.id === id);

    if (!sourceTheme) {
      throw new Error(`Theme ${id} not found`);
    }

    return state.createTheme(newName, sourceTheme.css);
  },

  resetDocument: (options) => {
    const state = get();
    const allThemes = state.getAllThemes();

    // Validate theme exists, fallback to default if not
    let targetTheme = options?.theme ?? 'default';
    let targetThemeName = options?.themeName ?? '默认主题';

    const themeExists = allThemes.some((t) => t.id === targetTheme);
    if (!themeExists) {
      console.warn(`Theme ${targetTheme} not found, falling back to default`);
      targetTheme = 'default';
      targetThemeName = '默认主题';
    }

    set({
      markdown: options?.markdown ?? defaultMarkdown,
      theme: targetTheme,
      themeName: targetThemeName,
      customCSS: options?.customCSS ?? '',
    });
  },

  copyToWechat: async () => {
    const { markdown, theme, getThemeCSS } = get();
    const css = getThemeCSS(theme);

    // Create a temporary container to render HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      // Use core's processHtml to render
      // Use the extracted service
      const { copyToWechat } = await import('../services/wechatCopyService');
      await copyToWechat(markdown, css);
    } catch (error) {
      console.error('Copy failed:', error);
      // Toast is handled in the service, but we catch here just in case
    }
  },

  currentFilePath: undefined,
  workspaceDir: undefined,
  setFilePath: (path) => set({ currentFilePath: path }),
  setWorkspaceDir: (dir) => set({ workspaceDir: dir }),
}));
