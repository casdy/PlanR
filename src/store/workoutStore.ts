import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WorkoutStatus = 'idle' | 'running' | 'paused' | 'finished';

interface WorkoutState {
    status: WorkoutStatus;
    activeProgramId: string | null;
    activeDayId: string | null;
    activeExerciseIndex: number;

    // Timer state
    elapsedSeconds: number;
    timerDuration: number; // Duration for the current exercise (default 60s)

    // Actions
    startWorkout: (programId: string, dayId: string) => void;
    pauseWorkout: () => void;
    resumeWorkout: () => void;
    finishWorkout: () => void;
    cancelWorkout: () => void;

    setExerciseIndex: (index: number) => void;
    nextExercise: (maxIndex: number) => void;
    prevExercise: () => void;

    tick: () => void; // Increment elapsed seconds
    resetTimer: () => void;

    // AI/Voice logging
    exerciseLogs: Record<string, { reps?: number, weight?: number }[]>;
    logExerciseSet: (programId: string, dayId: string, exerciseIndex: number, reps: number, weight: number) => void;
    
    // Achievement badges
    lastBadgeUrl: string | null;
    setBadgeUrl: (url: string | null) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            status: 'idle',
            activeProgramId: null,
            activeDayId: null,
            activeExerciseIndex: 0,
            elapsedSeconds: 0,
            timerDuration: 60,

            startWorkout: (programId, dayId) => set({
                status: 'running',
                activeProgramId: programId,
                activeDayId: dayId,
                activeExerciseIndex: 0,
                elapsedSeconds: 0
            }),

            pauseWorkout: () => set({ status: 'paused' }),

            resumeWorkout: () => set({ status: 'running' }),

            finishWorkout: () => set({ status: 'finished' }), // Logic to log would be handled by component usually

            cancelWorkout: () => set({
                status: 'idle',
                activeProgramId: null,
                activeDayId: null,
                activeExerciseIndex: 0,
                elapsedSeconds: 0
            }),

            setExerciseIndex: (index) => set({
                activeExerciseIndex: index,
                elapsedSeconds: 0 // Reset timer on manual switch? Maybe user pref.
            }),

            nextExercise: (maxIndex) => {
                const { activeExerciseIndex } = get();
                if (activeExerciseIndex < maxIndex) {
                    set({
                        activeExerciseIndex: activeExerciseIndex + 1,
                        elapsedSeconds: 0
                    });
                } else {
                    set({ status: 'finished' });
                }
            },

            prevExercise: () => {
                const { activeExerciseIndex } = get();
                if (activeExerciseIndex > 0) {
                    set({
                        activeExerciseIndex: activeExerciseIndex - 1,
                        elapsedSeconds: 0
                    });
                }
            },

            tick: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

            resetTimer: () => set({ elapsedSeconds: 0 }),

            exerciseLogs: {},
            logExerciseSet: (programId, dayId, exerciseIndex, reps, weight) => {
                const key = `${programId}-${dayId}-${exerciseIndex}`;
                set((state) => {
                    const currentLogs = state.exerciseLogs[key] || [];
                    return {
                        exerciseLogs: {
                            ...state.exerciseLogs,
                            [key]: [...currentLogs, { reps, weight }]
                        }
                    };
                });
            },

            lastBadgeUrl: null,
            setBadgeUrl: (url) => set({ lastBadgeUrl: url })
        }),
        {
            name: 'juuk-workout-storage', // key in local storage
            partialize: (state) => ({
                // Persist only these fields to survive refreshes
                status: state.status,
                activeProgramId: state.activeProgramId,
                activeDayId: state.activeDayId,
                activeExerciseIndex: state.activeExerciseIndex,
                elapsedSeconds: state.elapsedSeconds
            }),
        }
    )
);
