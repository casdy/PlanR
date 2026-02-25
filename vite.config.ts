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

      // /api/cdn-proxy?url=<encoded CDN URL>
      // Matches what api/cdn-proxy.js serverless fn does in production.
      // Extracts the CDN URL from query params, fetches it, adds CORP headers.
      '/api/cdn-proxy': {
        target: 'https://cdn.exercisedb.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // Extract the `url` query param value and use its pathname
          try {
            const match = path.match(/[?&]url=([^&]+)/);
            if (match) {
              const cdnUrl = decodeURIComponent(match[1]);
              const url = new URL(cdnUrl);
              return url.pathname;
            }
          } catch (e) { /* fall through */ }
          return path.replace(/^\/api\/cdn-proxy/, '');
        },
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (_proxyRes, _req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          });
        }
      },

      // All other /api/* calls go to Vercel serverless functions via vercel dev
    }
  }
})
