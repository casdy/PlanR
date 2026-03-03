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
  
        // /api/cdn-proxy?url=<encoded CDN URL>
        // Fetches the image and injects CORP headers so they load under COEP.
        '/api/cdn-proxy': {
          target: 'https://v2.exercisedb.io', // overridden in router, but must be https:// to force TLS agent
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
            } catch (e) { /* fallback */ }
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
            } catch (e) { /* fallback */ }
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
                }
              } catch (e) { /* ignore */ }
            });
            proxy.on('proxyRes', (_proxyRes, _req, res) => {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            });
          }
        },
        // Dedicated proxy for wger media to inject CORP headers securely MUST be before /api/wger
        '/api/wger-media': {
          target: 'https://wger.de',
          changeOrigin: true,
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
          rewrite: (path) => path.replace(/^\/api\/wger/, '/api'),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Read key from .env.local (supports either exact match or VITE_ prefix)
              const apiKey = env.Wger_Key || env.VITE_WGER_API_KEY || '';
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Token ${apiKey}`);
              }
            });
          }
        },
        '/api/exercisedb': {
          target: 'https://exercisedb.p.rapidapi.com',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const endpoint = url.searchParams.get('endpoint'); // e.g., 'exercises'
            return endpoint ? `/${endpoint}` : '/exercises';
          },
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Strip any query params that aren't for the API
              const originalUrl = new URL(req.url || '', 'http://localhost');
              const newUrl = new URL(proxyReq.path, 'http://localhost');
              
              originalUrl.searchParams.forEach((value, key) => {
                if (key !== 'endpoint') {
                  newUrl.searchParams.append(key, value);
                }
              });
              proxyReq.path = newUrl.pathname + newUrl.search;
  
              // Add the required headers for RapidAPI
              const apiKey = env.RAPIDAPI_KEY || env.VITE_EXERCISEDB_API_KEY || '';
              proxyReq.setHeader('x-rapidapi-key', apiKey);
              proxyReq.setHeader('x-rapidapi-host', 'exercisedb.p.rapidapi.com');
            });
          }
        },
        '/api/workoutdb': {
          // Direct API — free to use at workoutdb.is-app.in/api/
          // Docs: https://workoutdb.is-app.in/docs
          // Auth: x-rapidapi-key header (get a free key at https://rapidapi.com/ad733943/api/workout-db-api)
          target: 'https://workoutdb.is-app.in',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const endpoint = url.searchParams.get('endpoint'); 
            // Prepend /api/ — the direct server hosts the API under /api/
            return endpoint ? `/api/${endpoint}` : '/api/workouts';
          },
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              const originalUrl = new URL(req.url || '', 'http://localhost');
              const newUrl = new URL(proxyReq.path, 'http://localhost');
              
              originalUrl.searchParams.forEach((value, key) => {
                if (key !== 'endpoint') {
                  newUrl.searchParams.append(key, value);
                }
              });
              proxyReq.path = newUrl.pathname + newUrl.search;
  
              // Use WORKOUTDB_API_KEY if available (direct key from workoutdb.is-app.in),
              // otherwise fall back to RAPIDAPI_KEY
              const apiKey = env.WORKOUTDB_API_KEY || env.RAPIDAPI_KEY || env.VITE_RAPIDAPI_KEY || '';
              if (apiKey) {
                proxyReq.setHeader('x-rapidapi-key', apiKey);
              }
              proxyReq.setHeader('x-rapidapi-host', 'workoutdb.is-app.in');
            });
          }
        }
        // All other /api/* calls go to Vercel serverless functions via vercel dev
      }
    }
  }
})
