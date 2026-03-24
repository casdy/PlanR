/**
 * @file api/quota.ts
 * @description Quota tracking for Gemini API limits.
 * Tracks Requests Per Day (RPD) and Tokens Per Minute (TPM).
 */

const MAX_RPD = 1500; // Free tier Gemini 1.5 Flash limit
const MAX_TPM = 1000000; // Free tier TPM for 1.5 Flash is high, but we track it

// In-memory cache for Vercel Serverless environment.
// In a production environment, this should be replaced with Vercel KV.
const quotaCache = (globalThis as any).__QUOTA_CACHE__ || new Map<string, { requests: number, tokens: number, lastReset: number }>();
if (!(globalThis as any).__QUOTA_CACHE__) {
    (globalThis as any).__QUOTA_CACHE__ = quotaCache;
}

/**
 * Get current quota status for an IP/User.
 * Resets daily automatically based on the lastReset timestamp.
 */
export function getQuotaData(ip: string = "default") {
    const now = Date.now();
    const data = quotaCache.get(ip) || { requests: 0, tokens: 0, lastReset: now };
    
    // Check for daily reset (24h)
    if (now - data.lastReset > 24 * 60 * 60 * 1000) {
        data.requests = 0;
        data.tokens = 0;
        data.lastReset = now;
        quotaCache.set(ip, data);
    }

    return {
        limit: MAX_RPD,
        used: data.requests,
        remaining: Math.max(0, MAX_RPD - data.requests),
        tokensUsed: data.tokens,
        tpmLimit: MAX_TPM,
        sparks: Math.max(0, MAX_RPD - data.requests) // "AI Sparks" 
    };
}

/**
 * Record usage and return true if under limit.
 */
export function decrementQuota(ip: string = "default", tokenEstimate: number = 500): boolean {
    const now = Date.now();
    const data = quotaCache.get(ip) || { requests: 0, tokens: 0, lastReset: now };
    
    if (data.requests >= MAX_RPD) {
        return false;
    }

    data.requests += 1;
    data.tokens += tokenEstimate;
    quotaCache.set(ip, data);
    return true;
}

export default function handler(req: any, res: any) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const ip = req.headers['x-forwarded-for'] || 'default';
    
    if (req.query.decrement) {
        decrementQuota(ip as string);
    }
    
    const quota = getQuotaData(ip as string);
    return res.status(200).json(quota);
}
