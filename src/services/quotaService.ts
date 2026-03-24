/**
 * @file src/services/quotaService.ts
 * @description Frontend service to track and display AI Quota (Sparks).
 * Bridges the gap between backend RPD/TPM tracking and frontend UI.
 * Now includes a robust localStorage fallback to handle offline/dev-no-backend scenarios.
 */

const LOCAL_QUOTA_KEY = 'planr_local_quota';
const DEFAULT_MAX_QUOTA = 1500;

function getLocalQuota(): number {
    const val = localStorage.getItem(LOCAL_QUOTA_KEY);
    if (val === null) return DEFAULT_MAX_QUOTA;
    return parseInt(val, 10);
}

function setLocalQuota(val: number) {
    localStorage.setItem(LOCAL_QUOTA_KEY, val.toString());
}

export const quotaService = {
    /** Returns true if the user likely has quota left (optimistic check). */
    async canUseGroq(): Promise<boolean> {
        try {
            const res = await fetch('/api/quota');
            if (!res.ok) return getLocalQuota() > 0; 
            const data = await res.json();
            // Sync local with remote if remote is higher
            if (data.remaining > getLocalQuota()) setLocalQuota(data.remaining);
            return data.remaining > 0;
        } catch {
            // Fallback to local tracking if API is down (ECONNREFUSED)
            return getLocalQuota() > 0;
        }
    },

    /** Trigger a backend decrement record. */
    async recordGroqUsage(): Promise<void> {
        // Optimistically decrement local first
        const current = getLocalQuota();
        setLocalQuota(Math.max(0, current - 1));

        try {
            await fetch('/api/quota?decrement=true');
        } catch (err) {
            // Silent catch to prevent console proxy spam
            // We already decremented locally
        }
    },

    /** How many prompts or "Sparks" are left. */
    async getRemainingGroq(): Promise<number> {
        try {
            const res = await fetch('/api/quota');
            if (!res.ok) return getLocalQuota();
            const data = await res.json();
            return data.remaining;
        } catch {
            return getLocalQuota();
        }
    },

    /** Returns human-readable info on when more prompts are available. */
    getResetMessage(): string {
        return 'Refreshes every 24h';
    }
};
