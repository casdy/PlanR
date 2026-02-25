import type { WorkoutProgram, WorkoutLog, WorkoutDay } from '../types';
import { DEFAULT_PROGRAMS } from './programService';
import { supabase } from '../lib/supabase';

const DB_PREFIX = 'juuk_fitness_v1_';
const PROGRAMS_KEY = `${DB_PREFIX}workout_plans`;
const PROGRESS_KEY = `${DB_PREFIX}workout_progress`;
const LOGS_KEY = `${DB_PREFIX}workout_logs`;

export const LocalService = {
    // --- Programs ---
    getUserPrograms: (): WorkoutProgram[] => {
        const stored = localStorage.getItem(PROGRAMS_KEY);

        if (stored) {
            const programsMap = JSON.parse(stored);
            return Object.values(programsMap).map((p: any, idx) => ({
                ...p,
                id: p.id || Object.keys(programsMap)[idx],
                userId: 'guest',
                version: 1,
                isPublic: false
            }));
        } else {
            // Seed defaults
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

    saveProgram: (program: WorkoutProgram) => {
        const programs = LocalService.getUserPrograms();
        const programsMap: Record<string, WorkoutProgram> = {};
        
        programs.forEach(p => {
            programsMap[p.id] = p;
        });
        
        programsMap[program.id] = {
            ...program,
            userId: 'guest'
        };
        
        localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programsMap));
    },

    deleteProgram: (programId: string) => {
        const programs = LocalService.getUserPrograms();
        const programsMap: Record<string, WorkoutProgram> = {};
        
        programs.forEach(p => {
            if (p.id !== programId) {
                programsMap[p.id] = p;
            }
        });
        
        localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programsMap));
    },

    // --- Logs ---
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
            completedAt: null, // Not completed yet
            events: [{ type: 'start', timestamp: Date.now() }]
        };
        
        const logs = LocalService.getLogs();
        logs.push(newLog);
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
        return sessionId;
    },

    updateWorkoutSession: (sessionId: string, updates: Partial<WorkoutLog>) => {
        const logs = LocalService.getLogs();
        const index = logs.findIndex(l => l.sessionId === sessionId);
        if (index !== -1) {
            logs[index] = { ...logs[index], ...updates };
            localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
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

    logWorkout: async (log: Omit<WorkoutLog, 'id' | 'completedAt'> & { id?: string, completedAt?: any }, userId: string = 'guest') => {
        // If we're updating a finished session, it already has an ID
        const id = log.id || crypto.randomUUID();
        const completedAt = log.completedAt || new Date().toISOString();
        const fullLog: WorkoutLog = { ...log, id, userId, completedAt, sessionId: log.sessionId || id };
        
        try {
            const { error } = await supabase
                .from('workout_history')
                .insert([{
                    id,
                    program_id: log.programId,
                    day_id: log.dayId,
                    user_id: userId,
                    timestamp: completedAt
                }]);
                
            if (error) {
                console.error('[Supabase] Failed to insert workout log:', error);
            }
        } catch (e) {
            console.error('[Supabase] Exception during log insertion:', e);
        }

        // Always update local legacy logs for backward compatibility and offline support
        const logs = LocalService.getLogs();
        
        // If this session already exists in logs (e.g. from createWorkoutSession), update it
        const existingSessionIndex = logs.findIndex(l => l.sessionId === fullLog.sessionId);
        if (existingSessionIndex !== -1) {
            logs[existingSessionIndex] = { ...logs[existingSessionIndex], ...fullLog };
        } else {
            logs.push(fullLog);
        }
        
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    },

    getLogs: (userId?: string): WorkoutLog[] => {
        const stored = localStorage.getItem(LOGS_KEY);
        const logs: WorkoutLog[] = stored ? JSON.parse(stored) : [];
        if (userId && userId !== 'guest') {
            return logs.filter(l => l.userId === userId);
        }
        return logs;
    },

    deleteLog: (logId: string) => {
        const logs = LocalService.getLogs();
        const filtered = logs.filter(l => l.id !== logId && l.sessionId !== logId);
        localStorage.setItem(LOGS_KEY, JSON.stringify(filtered));
        // Also attempt to delete from Supabase if we have a real user, though for now
        // since we aren't strongly enforcing sync, local deletion is primary.
    },

    // --- Progress ---
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

    getWeeklyVolume: async (userId: string = 'guest') => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { data, error } = await supabase
            .from('workout_history')
            .select('total_volume')
            .eq('user_id', userId)
            .gte('timestamp', oneWeekAgo.toISOString());
            
        if (error || !data) {
            console.error('[Supabase] Error fetching weekly volume:', error);
            return 0;
        }
        
        return data.reduce((sum, row) => sum + (row.total_volume || 0), 0);
    },

    getCurrentStreak: async (userId: string = 'guest') => {
        const { data, error } = await supabase
            .from('workout_history')
            .select('timestamp')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
            
        if (error || !data || data.length === 0) return 0;
        
        const dates = [...new Set(data.map(v => new Date(v.timestamp as string).toDateString()))];
        
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
