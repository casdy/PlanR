import type { WorkoutProgram, WorkoutLog, WorkoutDay } from '../types';
import { DEFAULT_PROGRAMS } from './programService';

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
    logWorkout: (log: Omit<WorkoutLog, 'id' | 'completedAt'>) => {
        const logs = LocalService.getLogs();
        const newLog: WorkoutLog = {
            ...log,
            id: crypto.randomUUID(),
            completedAt: new Date().toISOString() as any // Mocking timestamp
        };
        
        logs.push(newLog);
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    },

    getLogs: (): WorkoutLog[] => {
        const stored = localStorage.getItem(LOGS_KEY);
        return stored ? JSON.parse(stored) : [];
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
    }
};
