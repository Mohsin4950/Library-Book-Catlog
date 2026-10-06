import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Flask backend used by `npm run dev` (override with API_URL=http://localhost:5050 npm run dev)
  const apiUrl = loadEnv(mode, process.cwd(), '').API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    // The production build is served by Flask at /ui/
    base: command === 'build' ? '/ui/' : '/',
    server: {
      proxy: {
        '/items': apiUrl,
        '/health': apiUrl,
        '/api': apiUrl,
      },
    },
  }
})
