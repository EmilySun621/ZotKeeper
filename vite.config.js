import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // TheMealDB (if still used elsewhere) — more specific first
      '/api/themealdb': {
        target: 'https://www.themealdb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/themealdb/, '/api/json/v1/1'),
      },
      // Recipe API (Spoonacular proxy) — run: cd server && npm run dev
      '/api/health': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/search': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/cuisines': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/recipes': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
