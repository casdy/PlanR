/**
 * @file src/services/programService.ts
 * @description Workout program data layer — default templates and CRUD operations.
 *
 * Contains three built-in seeded programs (`gym`, `home`, `cardio`) that are
 * shown to new users. `ProgramService` delegates all read/write calls to
 * `LocalService` for the actual localStorage persistence.
 *
 * `DEFAULT_PROGRAMS` is also exported and consumed by `LocalService` to seed
 * the user's storage on first launch.
 */
import { LocalService } from './localService';
import { DEFAULT_PROGRAMS } from './defaults';
import type { WorkoutProgram, WorkoutLog } from '../types';

export { DEFAULT_PROGRAMS };

export const ProgramService = {
    getUserPrograms: async (_userId: string): Promise<WorkoutProgram[]> => {
        return LocalService.getUserPrograms();
    },

    saveProgram: async (program: WorkoutProgram) => {
        LocalService.saveProgram(program);
    },

    deleteProgram: async (programId: string) => {
        LocalService.deleteProgram(programId);
    },

    logWorkout: async (log: Omit<WorkoutLog, 'id' | 'completedAt'>) => {
        LocalService.logWorkout(log);
    },

    seedDefaultPrograms: async (_userId: string): Promise<WorkoutProgram[]> => {
        return LocalService.getUserPrograms();
    }
};
