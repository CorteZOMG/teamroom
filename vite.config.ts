import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  },
  server: {
    host: true, // Listen on all addresses (for Docker)
    port: 5173,
    proxy: {
      // Proxy API calls to backend in development
      '/api': {
        target: process.env.VITE_API_URL,
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_WS_URL,
        ws: true,
      }
    }
  }
})
