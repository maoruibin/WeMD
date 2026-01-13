# API 文档

> WeMD 的 API 接口说明

---

## 🔌 内部 API

### 核心包 API (@wemd/core)

```typescript
// MarkdownParser
export function createParser(options?: ParserOptions): MarkdownIt;

// ThemeProcessor
export function processWithTheme(
  markdown: string,
  theme: Theme,
  options?: ProcessOptions
): ProcessedResult;

// 深色模式转换
export function convertCssToWeChatDarkMode(
  css: string
): ConvertedCss;
```

---

### 存储适配器 API

```typescript
// IndexedDBAdapter
interface IndexedDBAdapter {
  saveDocument(id: string, content: string): Promise<void>;
  getDocument(id: string): Promise<Document | null>;
  listDocuments(): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;
}

// FileSystemAdapter
interface FileSystemAdapter {
  openFile(): Promise<FileHandle>;
  saveFile(handle: FileHandle, content: string): Promise<void>;
}
```

---

### Store API

```typescript
// editorStore
interface EditorStore {
  markdown: string;
  setMarkdown: (content: string) => void;
  // ...
}

// themeStore
interface ThemeStore {
  themeName: string;
  setTheme: (name: string) => void;
  customThemes: CustomTheme[];
  // ...
}
```

---

## 🌐 外部 API (规划中)

### 图床 API

```typescript
// 图片上传
interface ImageUploadAPI {
  upload(file: File): Promise<string>; // 返回图片 URL
  delete(url: string): Promise<void>;
  list(): Promise<ImageInfo[]>;
}
```

---

## 📝 变更记录

| 日期 | 变更内容 |
|------|----------|
| 2024-01-13 | 初始版本 |
