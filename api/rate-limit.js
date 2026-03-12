/**
 * Simple IP-based rate limiting for Vercel Serverless Functions.
 * Note: Vercel serverless functions are stateless, so this uses a simple 
 * in-memory cache that persists across warm invocations for a specific instance.
 * For production-scale robust limiting, use Upstash Redis or similar KV store.
 */

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // max requests per minute

const cache = new Map();

/**
 * Check if the request should be rate limited.
 * @param {string} ip - The client IP address
 * @returns {boolean} - True if rate limited
 */
export function checkRateLimit(ip) {
  if (!ip) return false;

  const now = Date.now();
  const userData = cache.get(ip) || { count: 0, startTime: now };

  if (now - userData.startTime > RATE_LIMIT_WINDOW) {
    userData.count = 1;
    userData.startTime = now;
  } else {
    userData.count++;
  }

  cache.set(ip, userData);

  // Periodically clean up cache (every 100 requests)
  if (cache.size > 1000) {
    for (const [key, val] of cache.entries()) {
      if (now - val.startTime > RATE_LIMIT_WINDOW) {
        cache.delete(key);
      }
    }
  }

  return userData.count > MAX_REQUESTS;
}
