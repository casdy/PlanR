import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

export interface OPFSDatabase {
    exec: (options: any) => any;
    prepare: (sql: string) => any;
    close: () => void;
}

let dbInstance: OPFSDatabase | null = null;
let initPromise: Promise<OPFSDatabase> | null = null;

export async function initOPFSDatabase(): Promise<OPFSDatabase> {
    if (dbInstance) return dbInstance;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            console.log('[sqlite-opfs] Initializing SQLite Wasm...');
            const sqlite3 = await sqlite3InitModule();

            console.log('[sqlite-opfs] SQLite initialized. Checking OPFS support...');
            
            // @ts-expect-error - opfs not always typed on Sqlite3Static wrapper
            if (!sqlite3.opfs) {
                console.warn('[sqlite-opfs] OPFS is not available in this environment. Falling back to memory/transient storage.');
                dbInstance = new sqlite3.oo1.DB('/planr_sqlite_db.sqlite3', 'ct');
            } else {
                console.log('[sqlite-opfs] OPFS is available. Proceeding with persistent storage.');
                // 'c' = create if not exists
                // 't' = trace (optional)
                dbInstance = new sqlite3.oo1.OpfsDb('/planr_sqlite_db.sqlite3', 'c');
            }

            console.log('[sqlite-opfs] Database connection established.');
            return dbInstance;
        } catch (error) {
            console.error('[sqlite-opfs] Initialization failed:', error);
            initPromise = null;
            throw error;
        }
    })();

    return initPromise;
}

/**
 * Singleton API for the application to safely query the database.
 */
export const OPFSDB = {
    async query(sql: string, params?: any[]) {
        const db = await initOPFSDatabase();
        
        if (!params || params.length === 0) {
            const rows: any[] = [];
            let columns: string[] = [];
            db.exec({
                sql: sql,
                rowMode: 'array',
                callback: (row: any) => { rows.push(row); },
                columnNames: columns
            });
            if (rows.length === 0) return [];
            return [{ columns, values: rows }];
        }

        try {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            
            const rows: any[] = [];
            while (stmt.step()) {
                rows.push(stmt.get([])); // gets array of values
            }
            const columns = stmt.getColumnNames();
            stmt.finalize();

            if (rows.length === 0) return [];
            return [{ columns, values: rows }];
        } catch (error) {
            console.error('[sqlite-opfs] Query execution error:', error);
            throw error;
        }
    },
    
    async run(sql: string, params?: any[]) {
        const db = await initOPFSDatabase();
        if (!params || params.length === 0) {
           db.exec({ sql });
           return;
        }

        try {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            stmt.step();
            stmt.finalize();
        } catch (error) {
            console.error('[sqlite-opfs] Run execution error:', error);
            throw error;
        }
    },

    async forceWipe() {
        console.warn('[sqlite-opfs] Wiping local database (removing from OPFS)...');
        // Close the connection before attempting deletion.
        if (dbInstance) {
            try {
                dbInstance.close();
            } catch (e) {
                console.error('[sqlite-opfs] Error closing DB:', e);
            }
            dbInstance = null;
            initPromise = null;
        }

        try {
            const root = await navigator.storage.getDirectory();
            await root.removeEntry('planr_sqlite_db.sqlite3', { recursive: false });
            console.log('[sqlite-opfs] Successfully wiped database file.');
        } catch (e) {
            console.warn('[sqlite-opfs] Could not wipe OPFS file (may not exist):', e);
        }
        window.location.reload();
    }
};
