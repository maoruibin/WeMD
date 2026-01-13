import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Electron 和大多数静态部署都建议使用相对路径
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/docs': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@wemd/core': '/Users/gudong/code/person/WeiMD/packages/core/src',
    },
  },
  optimizeDeps: {
    include: [
      'highlight.js',
      'juice',
      'katex',
      'markdown-it',
      'markdown-it-task-lists',
      'markdown-it-container',
      'markdown-it-deflist',
      'markdown-it-emoji',
      'markdown-it-implicit-figures',
      'markdown-it-imsize',
      'markdown-it-katex',
      'markdown-it-mark',
      'markdown-it-ruby',
      'markdown-it-sub',
      'markdown-it-sup',
      'markdown-it-table-of-contents',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心库单独分块
          'react-vendor': ['react', 'react-dom'],
          // CodeMirror 编辑器单独分块
          'codemirror': [
            'codemirror',
            '@codemirror/lang-markdown',
            '@codemirror/language',
            '@codemirror/state',
            '@codemirror/view',
            '@uiw/codemirror-theme-github',
          ],
        },
      },
    },
  },
})
