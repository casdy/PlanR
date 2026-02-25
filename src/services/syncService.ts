/**
 * @file src/services/syncService.ts
 * @description Supabase cloud sync layer for logged-in users.
 *
 * All functions are fire-and-forget safe — they log errors but never throw,
 * so a network failure never blocks the UI. localStorage is always the
 * source of truth for reads; Supabase is the durable remote backup.
 *
 * - `pullFromCloud(userId)` — called at login to hydrate localStorage from Supabase.
 * - `pushProgramToCloud(userId, program)` — upserts a program after any local write.
 * - `deleteProgramFromCloud(programId)` — removes a program from Supabase.
 * - `pushLogToCloud(userId, log)` — upserts a workout log after any local write.
 * - `deleteLogFromCloud(logId)` — removes a log from Supabase.
 */
import { supabase } from '../lib/supabase';
import type { WorkoutProgram, WorkoutLog } from '../types';

// localStorage key constants (mirrors localService.ts)
const DB_PREFIX = 'juuk_fitness_v1_';
const PROGRAMS_KEY = `${DB_PREFIX}workout_plans`;
const LOGS_KEY = `${DB_PREFIX}workout_logs`;

// ─────────────────────────────────────────────────────────────────────────────
// Pull (cloud → local) — called once at login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all programs and logs for the user from Supabase and merges them
 * into localStorage. Cloud data wins in the case of ID conflicts.
 */
export async function pullFromCloud(userId: string): Promise<void> {
    if (!userId || userId === 'guest') return;

    try {
        await Promise.all([
            pullProgramsFromCloud(userId),
            pullLogsFromCloud(userId),
        ]);
    } catch (err) {
        console.error('[SyncService] pullFromCloud failed:', err);
    }
}

async function pullProgramsFromCloud(userId: string): Promise<void> {
    const { data, error } = await supabase
        .from('workout_programs')
        .select('id, data')
        .eq('user_id', userId);

    if (error) {
        console.error('[SyncService] Failed to pull programs:', error.message);
        return;
    }

    if (!data || data.length === 0) return;

    // Merge cloud programs into the local map (cloud wins on conflict)
    const stored = localStorage.getItem(PROGRAMS_KEY);
    const localMap: Record<string, WorkoutProgram> = stored ? JSON.parse(stored) : {};

    for (const row of data) {
        localMap[row.id] = { ...(row.data as WorkoutProgram), id: row.id, userId };
    }

    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(localMap));
}

async function pullLogsFromCloud(userId: string): Promise<void> {
    const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        // Only pull the last 200 logs to keep localStorage lean
        .limit(200);

    if (error) {
        console.error('[SyncService] Failed to pull logs:', error.message);
        return;
    }

    if (!data || data.length === 0) return;

    // Merge cloud logs into local array (cloud wins on session_id conflict)
    const stored = localStorage.getItem(LOGS_KEY);
    const localLogs: WorkoutLog[] = stored ? JSON.parse(stored) : [];
    const localMap = new Map(localLogs.map(l => [l.sessionId, l]));

    for (const row of data) {
        const log: WorkoutLog = {
            id: row.id,
            sessionId: row.session_id,
            userId: userId,
            programId: row.program_id,
            dayId: row.day_id,
            date: row.date,
            completedAt: row.completed_at,
            totalTimeSpentSec: row.total_time_spent_sec ?? 0,
            completedExerciseIds: row.completed_exercise_ids ?? [],
            completedExerciseNames: row.completed_exercise_names ?? [],
            lastExerciseIndex: row.last_exercise_index ?? 0,
            isPaused: row.is_paused ?? false,
            events: row.events ?? [],
        };
        localMap.set(log.sessionId, log);
    }

    localStorage.setItem(LOGS_KEY, JSON.stringify(Array.from(localMap.values())));
}

// ─────────────────────────────────────────────────────────────────────────────
// Push (local → cloud) — called after every write
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upserts a single workout program to Supabase.
 * Serialises the full program as JSONB in the `data` column.
 */
export async function pushProgramToCloud(userId: string, program: WorkoutProgram): Promise<void> {
    if (!userId || userId === 'guest') return;

    const { error } = await supabase
        .from('workout_programs')
        .upsert({
            id: program.id,
            user_id: userId,
            data: program,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

    if (error) {
        console.error('[SyncService] Failed to push program:', error.message);
    }
}

/**
 * Deletes a single workout program from Supabase.
 */
export async function deleteProgramFromCloud(programId: string): Promise<void> {
    const { error } = await supabase
        .from('workout_programs')
        .delete()
        .eq('id', programId);

    if (error) {
        console.error('[SyncService] Failed to delete program:', error.message);
    }
}

/**
 * Upserts a single workout log row to Supabase.
 * Called after createWorkoutSession, updateWorkoutSession, and logWorkout.
 */
export async function pushLogToCloud(userId: string, log: WorkoutLog): Promise<void> {
    if (!userId || userId === 'guest') return;

    const { error } = await supabase
        .from('workout_logs')
        .upsert({
            id: log.id,
            session_id: log.sessionId,
            user_id: userId,
            program_id: log.programId,
            day_id: log.dayId,
            date: log.date,
            completed_at: log.completedAt ?? null,
            total_time_spent_sec: log.totalTimeSpentSec ?? 0,
            completed_exercise_ids: log.completedExerciseIds ?? [],
            completed_exercise_names: log.completedExerciseNames ?? [],
            last_exercise_index: log.lastExerciseIndex ?? 0,
            is_paused: log.isPaused ?? false,
            events: log.events ?? [],
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

    if (error) {
        console.error('[SyncService] Failed to push log:', error.message);
    }
}

/**
 * Deletes a single workout log from Supabase.
 */
export async function deleteLogFromCloud(logId: string): Promise<void> {
    const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', logId);

    if (error) {
        console.error('[SyncService] Failed to delete log:', error.message);
    }
}
