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
  
        // /api/cdn-proxy?url=<encoded CDN URL>
        '/api/cdn-proxy': {
          target: 'https://v2.exercisedb.io', // placeholder
          changeOrigin: true,
          secure: false,
          router: (req: any) => {
            try {
              const urlMatch = req.url?.match(/[?&]url=([^&]+)/);
              if (urlMatch) {
                const cdnUrl = decodeURIComponent(urlMatch[1]);
                const parsed = new URL(cdnUrl);
                return `${parsed.protocol}//${parsed.host}`;
              }
            } catch (e) {}
            return 'https://v2.exercisedb.io';
          },
          rewrite: (path) => {
            try {
              const match = path.match(/[?&]url=([^&]+)/);
              if (match) {
                const cdnUrl = decodeURIComponent(match[1]);
                const url = new URL(cdnUrl);
                return url.pathname + url.search;
              }
            } catch (e) {}
            return path.replace(/^\/api\/cdn-proxy/, '');
          },
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              try {
                const urlMatch = req.url?.match(/[?&]url=([^&]+)/);
                if (urlMatch) {
                  const cdnUrl = decodeURIComponent(urlMatch[1]);
                  const parsed = new URL(cdnUrl);
                  proxyReq.setHeader('Host', parsed.host);
                  proxyReq.setHeader('Referer', `${parsed.protocol}//${parsed.host}/`);
                }
              } catch (e) {}
            });
            proxy.on('proxyRes', (_proxyRes, _req, res) => {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            });
          }
        },
        '/api/wger-media': {
          target: 'https://wger.de',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/wger-media/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyRes', (_proxyRes, _req, res) => {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            });
          }
        },
        '/api/wger': {
          target: 'https://wger.de',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/wger/, '/api'),
        },
        '/api/exercisedb': {
          target: 'https://exercisedb.p.rapidapi.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const endpoint = url.searchParams.get('endpoint');
            return endpoint ? `/${endpoint}` : '/exercises';
          },
        },
        '/api/workoutdb': {
          target: 'https://workoutdb.is-app.in',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const endpoint = url.searchParams.get('endpoint'); 
            return endpoint ? `/api/${endpoint}` : '/api/workouts';
          },
        },
        // Dedicated proxy for Open Food Facts images
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
        // All other /api/* calls go to Vercel serverless functions via vercel dev
      }
    },
    build: {
      rollupOptions: {
        output: {
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
})
