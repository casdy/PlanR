/**
 * @file src/services/localService.ts
 * @description Offline-first data persistence layer built on localStorage.
 *
 * This service is the primary data store for PlanR. All workout programs, logs,
 * and session events are read and written here first (for instant UI response),
 * then synced to Supabase in the background for logged-in users.
 *
 * Key storage buckets:
 *  - `juuk_fitness_v1_programs`  → User's workout programs
 *  - `juuk_fitness_v1_logs`      → Per-session workout logs
 *  - `juuk_fitness_v1_progress`  → Exercise completion checkboxes
 *
 * Cloud sync (logged-in users only):
 *  All writes call the corresponding syncService function after updating localStorage.
 *  Guest users (userId === 'guest') are never synced to Supabase.
 */
import type { WorkoutProgram, WorkoutLog, WorkoutDay } from '../types';
import { DEFAULT_PROGRAMS } from './programService';
import {
    pushProgramToCloud,
    deleteProgramFromCloud,
    pushLogToCloud,
    deleteLogFromCloud,
} from './syncService';

const DB_PREFIX = 'juuk_fitness_v1_';
const PROGRAMS_KEY = `${DB_PREFIX}workout_plans`;
const PROGRESS_KEY = `${DB_PREFIX}workout_progress`;
const LOGS_KEY = `${DB_PREFIX}workout_logs`;

/** Returns true if the user is a real authenticated account (not guest). */
function isRealUser(userId?: string): userId is string {
    return !!userId && userId !== 'guest';
}

export const LocalService = {
    // ─── Programs ────────────────────────────────────────────────────────────

    getUserPrograms: (): WorkoutProgram[] => {
        const stored = localStorage.getItem(PROGRAMS_KEY);

        if (stored) {
            const programsMap = JSON.parse(stored);
            return Object.values(programsMap).map((p: any, idx) => ({
                ...p,
                id: p.id || Object.keys(programsMap)[idx],
                userId: p.userId || 'guest',
                version: 1,
                isPublic: false
            }));
        } else {
            // Seed defaults on first boot
            localStorage.setItem(PROGRAMS_KEY, JSON.stringify(DEFAULT_PROGRAMS));
            return Object.entries(DEFAULT_PROGRAMS).map(([id, p]) => ({
                ...p,
                id,
                userId: 'guest',
                version: 1,
                isPublic: false,
                schedule: p.schedule as unknown as WorkoutDay[]
            }));
        }
    },

    getProgramById: (id: string): WorkoutProgram | undefined => {
        const programs = LocalService.getUserPrograms();
        return programs.find(p => p.id === id);
    },

    /**
     * Saves (or updates) a program in localStorage and syncs it to Supabase
     * for authenticated users.
     */
    saveProgram: (program: WorkoutProgram) => {
        const programs = LocalService.getUserPrograms();
        const programsMap: Record<string, WorkoutProgram> = {};

        programs.forEach(p => {
            programsMap[p.id] = p;
        });

        programsMap[program.id] = program;
        localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programsMap));

        // Background cloud sync for real users
        if (isRealUser(program.userId)) {
            pushProgramToCloud(program.userId, program).catch(err =>
                console.error('[LocalService] saveProgram cloud sync failed:', err)
            );
        }
    },

    /**
     * Deletes a program from localStorage and removes it from Supabase.
     */
    deleteProgram: (programId: string, userId?: string) => {
        const programs = LocalService.getUserPrograms();
        const programsMap: Record<string, WorkoutProgram> = {};

        programs.forEach(p => {
            if (p.id !== programId) {
                programsMap[p.id] = p;
            }
        });

        localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programsMap));

        // Background cloud delete for real users
        if (isRealUser(userId)) {
            deleteProgramFromCloud(programId).catch(err =>
                console.error('[LocalService] deleteProgram cloud sync failed:', err)
            );
        }
    },

    // ─── Logs ─────────────────────────────────────────────────────────────────

    /**
     * Creates a new workout session log entry in localStorage and syncs to Supabase.
     * Returns the new session ID.
     */
    createWorkoutSession: (programId: string, dayId: string, userId: string = 'guest'): string => {
        const sessionId = crypto.randomUUID();
        const logId = crypto.randomUUID();
        const newLog: WorkoutLog = {
            id: logId,
            sessionId,
            userId,
            programId,
            dayId,
            date: new Date().toISOString(),
            completedExerciseIds: [],
            totalTimeSpentSec: 0,
            completedAt: null,
            events: [{ type: 'start', timestamp: Date.now() }]
        };

        const logs = LocalService.getLogs();
        logs.push(newLog);
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));

        // Background cloud sync for real users
        if (isRealUser(userId)) {
            pushLogToCloud(userId, newLog).catch(err =>
                console.error('[LocalService] createWorkoutSession cloud sync failed:', err)
            );
        }

        return sessionId;
    },

    /**
     * Updates an existing session log in localStorage and syncs the new state to Supabase.
     */
    updateWorkoutSession: (sessionId: string, updates: Partial<WorkoutLog>) => {
        const logs = LocalService.getLogs();
        const index = logs.findIndex(l => l.sessionId === sessionId);
        if (index !== -1) {
            logs[index] = { ...logs[index], ...updates };
            localStorage.setItem(LOGS_KEY, JSON.stringify(logs));

            // Background cloud sync for real users
            const updatedLog = logs[index];
            if (isRealUser(updatedLog.userId)) {
                pushLogToCloud(updatedLog.userId, updatedLog).catch(err =>
                    console.error('[LocalService] updateWorkoutSession cloud sync failed:', err)
                );
            }
        }
    },

    logWorkoutEvent: (sessionId: string, eventType: 'pause' | 'resume' | 'cancel' | 'finish') => {
        const logs = LocalService.getLogs();
        const sessionIndex = logs.findIndex(l => l.sessionId === sessionId);

        if (sessionIndex !== -1) {
            if (!logs[sessionIndex].events) {
                logs[sessionIndex].events = [];
            }
            logs[sessionIndex].events!.push({ type: eventType, timestamp: Date.now() });
            localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
        }
    },

    /**
     * Finalises a completed workout — updates the log with completedAt and syncs to Supabase.
     */
    logWorkout: async (log: Omit<WorkoutLog, 'id' | 'completedAt'> & { id?: string, completedAt?: any }, userId: string = 'guest') => {
        const id = log.id || crypto.randomUUID();
        const completedAt = log.completedAt || new Date().toISOString();
        const fullLog: WorkoutLog = { ...log, id, userId, completedAt, sessionId: log.sessionId || id };

        // Always update local logs first
        const logs = LocalService.getLogs();
        const existingSessionIndex = logs.findIndex(l => l.sessionId === fullLog.sessionId);
        if (existingSessionIndex !== -1) {
            logs[existingSessionIndex] = { ...logs[existingSessionIndex], ...fullLog };
        } else {
            logs.push(fullLog);
        }
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));

        // Background cloud sync for real users
        if (isRealUser(userId)) {
            pushLogToCloud(userId, fullLog).catch(err =>
                console.error('[LocalService] logWorkout cloud sync failed:', err)
            );
        }
    },

    getLogs: (userId?: string): WorkoutLog[] => {
        const stored = localStorage.getItem(LOGS_KEY);
        const logs: WorkoutLog[] = stored ? JSON.parse(stored) : [];
        if (userId && userId !== 'guest') {
            return logs.filter(l => l.userId === userId);
        }
        return logs;
    },

    /**
     * Deletes a log from localStorage and removes it from Supabase.
     */
    deleteLog: (logId: string, userId?: string) => {
        const logs = LocalService.getLogs();
        const filtered = logs.filter(l => l.id !== logId && l.sessionId !== logId);
        localStorage.setItem(LOGS_KEY, JSON.stringify(filtered));

        // Background cloud delete for real users
        if (isRealUser(userId)) {
            deleteLogFromCloud(logId).catch(err =>
                console.error('[LocalService] deleteLog cloud sync failed:', err)
            );
        }
    },

    // ─── Progress ─────────────────────────────────────────────────────────────

    getProgress: (): Record<string, boolean> => {
        const stored = localStorage.getItem(PROGRESS_KEY);
        return stored ? JSON.parse(stored) : {};
    },

    toggleExerciseCompliance: (programId: string, dayId: string, exerciseIndex: number) => {
        const progress = LocalService.getProgress();
        const storageKey = `${programId}-${dayId}-${exerciseIndex}`;

        if (progress[storageKey]) {
            delete progress[storageKey];
        } else {
            progress[storageKey] = true;
        }

        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        return progress;
    },

    // ─── Legacy Supabase stats (streak / volume) ───────────────────────────

    /** Computes weekly workout volume from local logs (offline-first fallback). */
    getWeeklyVolume: async (_userId: string = 'guest'): Promise<number> => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const logs = LocalService.getLogs();
        return logs.filter(l =>
            l.completedAt && new Date(l.completedAt) >= oneWeekAgo
        ).length;
    },

    /** Computes the consecutive day streak from local logs. */
    getCurrentStreak: async (_userId: string = 'guest'): Promise<number> => {
        const logs = LocalService.getLogs();
        if (logs.length === 0) return 0;

        const completedDates = [
            ...new Set(
                logs
                    .filter(l => l.completedAt)
                    .map(l => new Date(l.completedAt).toDateString())
            )
        ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        if (completedDates.length === 0) return 0;

        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (completedDates[0] !== today && completedDates[0] !== yesterday) return 0;

        let streak = 0;
        let checkDate = new Date(completedDates[0]);

        for (const dateStr of completedDates) {
            if (dateStr === checkDate.toDateString()) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }
};
