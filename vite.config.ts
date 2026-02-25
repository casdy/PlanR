import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
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
      '/api/nounproject': {
        target: 'https://api.thenounproject.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nounproject/, '')
      },
      '/api/exercisedb/media': {
        target: 'https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/media',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exercisedb\/media/, ''),
        configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
                proxyReq.setHeader('X-RapidAPI-Key', env.VITE_RAPIDAPI_KEY || '');
                proxyReq.setHeader('X-RapidAPI-Host', 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com');
            });
        }
      },
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
  },
  }
})
