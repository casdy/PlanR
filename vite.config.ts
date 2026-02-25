import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {

      // Vite proxy is only needed for the image CDN now.
      // API calls are handled by Vercel Serverless Functions in development and production.
      '/api/cdn-proxy': {
        target: 'https://cdn.exercisedb.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/cdn-proxy/, ''),
        configure: (proxy, _options) => {
            proxy.on('proxyRes', (_proxyRes, _req, res) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            });
        }
      }
    }
  }
})
