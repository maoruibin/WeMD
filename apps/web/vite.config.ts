import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
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
