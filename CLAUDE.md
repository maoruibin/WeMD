# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeMD is a Markdown-based article editor designed for WeChat Official Accounts (微信公众号). It converts Markdown to HTML with inline CSS that is compatible with WeChat's editor. The project is a monorepo using pnpm workspaces and Turborepo.

### Key Features

- **WeChat Dark Mode Preview**: A custom CSS transformation algorithm (`packages/core/src/wechatDarkMode.ts`) based on WeChat's official [wechatjs/mp-darkmode](https://github.com/wechatjs/mp-darkmode) that provides 98%+ accuracy for dark mode rendering
- **Custom Markdown Plugins**: Extends `markdown-it` with plugins for callouts, image flow slides, math formulas, and more
- **Theme System**: Built-in themes with custom CSS editing support
- **Local-First Storage**: Uses IndexedDB for document persistence with localStorage for settings
- **Cross-Platform**: Web app (Vite + React) and Desktop app (Electron)

## Common Commands

```bash
# Install dependencies (use pnpm)
pnpm install

# Development - Web app only
pnpm dev:web

# Development - Desktop (requires web running first)
pnpm dev:desktop

# Build all apps
pnpm build

# Build specific apps
pnpm --filter @wemd/web build
pnpm --filter wemd-electron run build:mac    # macOS
pnpm --filter wemd-electron run build:win    # Windows
pnpm --filter @wemd/core build               # Core package

# Lint all
pnpm lint

# Format code
pnpm format
```

## Monorepo Structure

```
WeMD/
├── apps/
│   ├── web/        # React + Vite frontend (main editor)
│   ├── electron/   # Electron desktop wrapper
│   ├── server/     # NestJS image upload server
│   ├── docs/       # VuePress documentation site
│   └── worker/     # Cloudflare Worker for R2 image uploads
├── packages/
│   └── core/       # Shared Markdown parser, themes, dark mode converter
├── templates/      # CSS theme source files
└── scripts/        # Build/utility scripts
```

## Architecture

### Core Package (`packages/core/`)

The `@wemd/core` package contains shared logic:

- **MarkdownParser.ts**: Creates and configures the `markdown-it` instance with custom plugins. Includes a patch for CJK (Chinese/Japanese/Korean) text emphasis markers.
- **ThemeProcessor.ts**: Processes HTML with CSS using `juice` for inline styles. Adds `data-tool` attributes and wraps content in `#wemd` section.
- **wechatDarkMode.ts**: The WeChat dark mode CSS conversion engine - the core algorithm for dark mode preview.
- **themes/**: Built-in theme definitions (TypeScript files exporting CSS strings)
- **plugins/**: Custom markdown-it plugins (imageflow, linkfoot, math, etc.)

### Web App (`apps/web/`)

React application using:
- **CodeMirror 6** for the Markdown editor (with search and Markdown language support)
- **Zustand** for state management (split into domain-specific stores)
- **React Router** for navigation (Editor page, Showcase page)
- **idb** for IndexedDB document storage

#### Store Architecture (`apps/web/src/store/`)

- **editorStore.ts**: Core editor state (markdown content, file paths, copy-to-wechat)
- **themeStore.ts**: Theme selection, custom theme CRUD, CSS caching
- **uiStore.ts**: UI state (sidebar open, dark mode, auto-paragraph)
- **fileStore.ts**: File listing for local file mode
- **historyStore.ts**: Document version history with IndexedDB persistence

#### Storage (`apps/web/src/storage/`)

Storage adapter pattern supporting:
- IndexedDB (default, for browser persistence)
- Local file system (via File System Access API)
- Export/import functionality

### Electron App (`apps/electron/`)

Desktop wrapper that loads the web app. Uses `ELECTRON_START_URL` environment variable to connect to dev server.

### Theme System

Themes are CSS strings exported from `packages/core/src/themes/`. The `templates/` directory contains source CSS files that should be converted to TypeScript exports in the core package.

When adding a new theme:
1. Add CSS file to `templates/YourTheme.css`
2. Create corresponding TypeScript file in `packages/core/src/themes/your-theme.ts`
3. Export from `packages/core/src/themes/index.ts`
4. Add to built-in themes in `apps/web/src/store/themes/builtInThemes.ts`

## Key Technical Details

### Markdown Preprocessing

The `preprocessMarkdown` function in `@wemd/core` automatically converts single newlines to double newlines (creating paragraphs) while preserving code blocks. This is controlled by `uiStore.isAutoParagraph`.

### WeChat Copy Service

Located at `apps/web/src/services/wechatCopyService.ts`. Uses Clipboard API with `text/html` and `text/plain` formats. The HTML is wrapped in a section with `data-tool="WeMD编辑器"` attribute.

### Dark Mode Conversion

The `convertCssToWeChatDarkMode` function parses CSS rules and converts colors based on:
- Element type (heading, body, table, code, etc.)
- HSL color space calculations
- Vibrant color protection
- WeChat-specific constants

Results are cached to avoid re-parsing the same CSS.

### TypeScript Configuration

The project uses `"strict": false` in tsconfig. TypeScript project references are used for the web app.

## Development Notes

- The web app runs on `localhost:5173` by default (Vite default)
- Electron expects the web app to be running when in development mode
- Theme CSS files in `templates/` are source files; themes are actually consumed from `packages/core/src/themes/*.ts`
- The worker app uses Cloudflare Workers with R2 bucket binding for image uploads
- When modifying markdown parsing behavior, check both `MarkdownParser.ts` and custom plugins in `packages/core/src/plugins/`
