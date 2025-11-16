import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Anything that starts with /api will be proxied to the backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setupTests.ts',
    // 只跑 unit 目录下的 *.test.ts / *.test.tsx
    include: ['tests/unit/**/*.spec.ts?(x)'],
    // 明确排除掉 Playwright 的 ui 测试
    exclude: ['tests/ui/**', 'node_modules/**', 'dist/**'],
  }
})
