import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9031,
    proxy: {
      '/api': {
        target: 'http://localhost:9030',
        changeOrigin: true,
      },
    },
  },
})
