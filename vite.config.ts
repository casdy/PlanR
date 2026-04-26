import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
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
        '/api/exercise-gifs': {
          target: 'https://yykfqceawzvxzqmogxvv.supabase.co/storage/v1/object/public/exercise-gifs',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/exercise-gifs/, ''),
          configure: (proxy) => {
            proxy.on('proxyRes', (_proxyRes, _req, res) => {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            });
          }
        },
        '/api/off-images': {
          target: 'https://images.openfoodfacts.org',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/off-images/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyRes', (_proxyRes, _req, res) => {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            });
          }
        },
        '/api/off-static': {
          target: 'https://static.openfoodfacts.org',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/off-static/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyRes', (_proxyRes, _req, res) => {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            });
          }
        },
        '/api/off': {
          target: 'https://world.openfoodfacts.org',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/off/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', 'Basic b2ZmOm9mZg==');
              proxyReq.setHeader('User-Agent', 'PlanR - WebDashboard - 1.0 - ojukwulabs@gmail.com');
            });
          }
        },
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 1000
    }
  }
})
