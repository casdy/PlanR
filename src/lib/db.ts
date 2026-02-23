import { OPFSDB } from './sqlite-opfs';

let isInitialized = false;

/**
 * Initializes the SQLite OPFS database and creates the necessary schemas if they don't exist.
 */
export async function initDB(): Promise<void> {
    if (isInitialized) return;

    try {
        console.log('[db] Verifying and deploying schema...');
        
        // Ensure users table exists
        await OPFSDB.run(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                password TEXT,
                name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Ensure workout_history table exists
        await OPFSDB.run(`
            CREATE TABLE IF NOT EXISTS workout_history (
                id TEXT PRIMARY KEY,
                program_id TEXT,
                day_id TEXT,
                user_id TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_volume REAL,
                total_reps INTEGER
            );
        `);
        
        // Ensure exercise_logs table exists
        await OPFSDB.run(`
            CREATE TABLE IF NOT EXISTS exercise_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workout_id TEXT,
                exercise_name TEXT,
                reps INTEGER,
                weight REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(workout_id) REFERENCES workout_history(id)
            );
        `);

        isInitialized = true;
        console.info('[db] Schema deployment complete');
    } catch (err) {
        console.error('[db] Critical initialization failure', err);
        throw err;
    }
}

/**
 * Public Data Access Object.
 * Replaces the legacy SQLiteDB export.
 */
export const SQLiteDB = {
    async query(sql: string, params?: any[]) {
        await initDB();
        return OPFSDB.query(sql, params);
    },
    
    async run(sql: string, params?: any[]) {
        await initDB();
        return OPFSDB.run(sql, params);
    },
    
    async init() {
        return initDB();
    },
    
    // Kept for backwards compatibility if referenced during cleanup,
    // OPFS automatically persists changes on the filesystem
    async save() {
        return Promise.resolve();
    },
    
    async forceWipe() {
        return OPFSDB.forceWipe();
    },
    
    async getWeeklyVolume(userId: string = 'guest') {
        const sql = `
            SELECT SUM(total_volume) as volume 
            FROM workout_history 
            WHERE user_id = ? AND timestamp >= date('now', 'weekday 0', '-7 days')
        `;
        const result = await this.query(sql, [userId]);
        if (!result || result.length === 0 || !result[0].values[0]) return 0;
        return Number(result[0].values[0][0]) || 0;
    },
    
    async getCurrentStreak(userId: string = 'guest') {
        const sql = `
            SELECT timestamp FROM workout_history 
            WHERE user_id = ?
            GROUP BY date(timestamp)
            ORDER BY date(timestamp) DESC
        `;
        const result = await this.query(sql, [userId]);
        if (!result || result.length === 0 || !result[0].values) return 0;

        const dates = result[0].values.map(v => new Date(v[0] as string).toDateString());
        let streak = 0;
        const today = new Date();
        const checkDate = new Date();

        const todayStr = today.toDateString();
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = checkDate.toDateString();

        if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

        let currentCheck = dates[0] === todayStr ? today : checkDate;
        
        for (const dateStr of dates) {
            if (dateStr === currentCheck.toDateString()) {
                streak++;
                currentCheck.setDate(currentCheck.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }
};
