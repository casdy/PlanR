import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WorkoutStatus = 'idle' | 'running' | 'paused' | 'finished';

interface WorkoutState {
    status: WorkoutStatus;
    activeProgramId: string | null;
    activeDayId: string | null;
    activeExerciseIndex: number;
    activeIntensity: 'light' | 'standard' | 'intense';
    isRecoveryMode: boolean;

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

    scaleIntensity: (intensity: 'light' | 'standard' | 'intense') => void;
    swapToRecovery: () => void;

    tick: () => void; // Increment elapsed seconds
    resetTimer: () => void;

    // AI/Voice logging
    exerciseLogs: Record<string, { reps?: number, weight?: number }[]>;
    logExerciseSet: (programId: string, dayId: string, exerciseIndex: number, reps: number, weight: number) => void;
    
    // Achievement badges
    lastBadgeUrl: string | null;
    badgePrompt: string | null;
    setBadgeUrl: (url: string | null) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            status: 'idle',
            activeProgramId: null,
            activeDayId: null,
            activeExerciseIndex: 0,
            activeIntensity: 'standard',
            isRecoveryMode: false,
            elapsedSeconds: 0,
            timerDuration: 60,

            startWorkout: (programId, dayId) => set({
                status: 'running',
                activeProgramId: programId,
                activeDayId: dayId,
                activeExerciseIndex: 0,
                activeIntensity: 'standard',
                isRecoveryMode: false,
                elapsedSeconds: 0
            }),

            pauseWorkout: () => set({ status: 'paused' }),

            resumeWorkout: () => set({ status: 'running' }),

            finishWorkout: () => {
                const { exerciseLogs } = get();
                let totalVolume = 0;
                let exerciseCount = 0;
                
                Object.values(exerciseLogs).forEach(sets => {
                    if (sets.length > 0) exerciseCount++;
                    sets.forEach(set => {
                        totalVolume += (set.reps || 0) * (set.weight || 0);
                    });
                });

                const prompt = `A hyper-realistic 3D digital gold badge, futuristic gym trophy aesthetic, centered, dark glowing background, representing a completed workout with ${exerciseCount} exercises and ${totalVolume.toLocaleString()} lbs total volume lifted. Highly detailed 8k render, Unreal Engine 5 style.`;
                
                set({ status: 'finished', badgePrompt: prompt });
            },

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

            scaleIntensity: (intensity) => set({ activeIntensity: intensity }),

            swapToRecovery: () => set({
                isRecoveryMode: true,
                activeExerciseIndex: 0,
                elapsedSeconds: 0
                // Implementation note: The UI will handle the actual exercise replacement
                // based on this flag.
            }),

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
            badgePrompt: null,
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
