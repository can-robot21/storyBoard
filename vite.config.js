// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/storyBoard/',
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      buffer: false
    }
  },
  optimizeDeps: {
    include: ['sql.js']
  },
  build: {
    rollupOptions: {
      external: ['fs', 'path', 'crypto', 'stream', 'buffer'],
      output: {
        globals: {
          fs: '{}',
          path: '{}',
          crypto: '{}',
          stream: '{}',
          buffer: '{}'
        }
      }
    }
  }
});