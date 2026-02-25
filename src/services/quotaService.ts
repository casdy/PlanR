/**
 * Quota Service — prevents users from burning all API credits on every load.
 * Uses sessionStorage so limits reset when the browser tab/window is closed.
 */

const GROQ_SESSION_KEY = 'planr_groq_gen_count';
const GROQ_SESSION_LIMIT = 5; // Max AI generations per browser session

export const quotaService = {
    /** Returns true if the user still has Groq AI generation quota this session. */
    canUseGroq(): boolean {
        const used = Number(sessionStorage.getItem(GROQ_SESSION_KEY) || '0');
        return used < GROQ_SESSION_LIMIT;
    },

    /** Record a single Groq usage. Call AFTER a successful AI generation. */
    recordGroqUsage(): void {
        const used = Number(sessionStorage.getItem(GROQ_SESSION_KEY) || '0');
        sessionStorage.setItem(GROQ_SESSION_KEY, String(used + 1));
    },

    /** How many AI generations the user has left this session. */
    getRemainingGroq(): number {
        const used = Number(sessionStorage.getItem(GROQ_SESSION_KEY) || '0');
        return Math.max(0, GROQ_SESSION_LIMIT - used);
    },

    /** Total session limit (for display). */
    getLimit(): number {
        return GROQ_SESSION_LIMIT;
    }
};
