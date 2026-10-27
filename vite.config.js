import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev proxy avoids CORS issues with TinyURL's no-key endpoint while developing.
export default defineConfig({
  plugins: [react()], base: "/url-shortener-v2",
  server: {
    proxy: {
      '/tinyurl': {
        target: 'https://tinyurl.com',
        changeOrigin: true,
        rewrite: () => '/api-create.php',
      },
    },
  },
})
