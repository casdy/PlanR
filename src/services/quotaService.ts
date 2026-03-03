const QUOTA_KEY = 'planr_prompt_quota';
const RESET_KEY = 'planr_quota_reset_time';
const DAILY_LIMIT = 5;

export const quotaService = {
    /** Returns true if the user still has Groq AI generation quota. */
    canUseGroq(): boolean {
        this.checkReset();
        const used = Number(localStorage.getItem(QUOTA_KEY) || '0');
        return used < DAILY_LIMIT;
    },

    /** Record a single usage. */
    recordGroqUsage(): void {
        this.checkReset();
        const used = Number(localStorage.getItem(QUOTA_KEY) || '0');
        localStorage.setItem(QUOTA_KEY, String(used + 1));
        
        // If we just hit the limit, set the reset time for 24 hours from now
        if (used + 1 >= DAILY_LIMIT) {
            const nextReset = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem(RESET_KEY, String(nextReset));
        }
    },

    /** How many prompts the user has left. */
    getRemainingGroq(): number {
        this.checkReset();
        const used = Number(localStorage.getItem(QUOTA_KEY) || '0');
        return Math.max(0, DAILY_LIMIT - used);
    },

    /** Returns human-readable info on when more prompts are available. */
    getResetMessage(): string {
        const resetTime = Number(localStorage.getItem(RESET_KEY) || '0');
        if (!resetTime || Date.now() >= resetTime) return 'More available now';
        
        const diffMs = resetTime - Date.now();
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        
        if (diffHours >= 1) return `Next prompt in ~${diffHours}h`;
        const diffMins = Math.ceil(diffMs / (1000 * 60));
        return `Next prompt in ${diffMins}m`;
    },

    /** Internal check to reset quota if 24h passed. */
    checkReset(): void {
        const resetTime = Number(localStorage.getItem(RESET_KEY) || '0');
        if (resetTime && Date.now() >= resetTime) {
            localStorage.setItem(QUOTA_KEY, '0');
            localStorage.removeItem(RESET_KEY);
        }
    }
};
