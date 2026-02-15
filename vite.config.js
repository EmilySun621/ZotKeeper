import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Avoid CORS in dev: /api/themealdb/* -> TheMealDB
      '/api/themealdb': {
        target: 'https://www.themealdb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/themealdb/, '/api/json/v1/1'),
      },
    },
  },
})
