/**
 * @file src/store/workoutStore.ts
 * @description Zustand store for the active workout session.
 *
 * This is the central brain of the live workout experience. It tracks:
 * - The current session (program, day, exercise index, timer state)
 * - Exercise completion (IDs and human-readable names)
 * - Session lifecycle: start → running → paused → idle or finished
 *
 * Pausing a workout persists the session to LocalService with `isPaused: true`
 * and resets the store to `idle` so multiple paused sessions can co-exist in
 * the Activity feed. Any of them can be re-loaded via `resumeOldWorkout`.
 *
 * Starting a new workout automatically saves the currently active session as paused
 * before resetting to the new session.
 *
 * Usage:
 *   const { status, startWorkout, pauseWorkout, finishWorkout } = useWorkoutStore();
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocalService } from '../services/localService';
import { supabase } from '../lib/supabase';
import type { WorkoutLog } from '../types';

type WorkoutStatus = 'idle' | 'running' | 'paused' | 'finished' | 'physique_capture';

interface WorkoutState {
    status: WorkoutStatus;
    activeProgramId: string | null;
    activeDayId: string | null;
    activeSessionId: string | null;
    activeExerciseIndex: number;
    activeIntensity: 'light' | 'standard' | 'intense';
    isRecoveryMode: boolean;
    isMinimized: boolean;

    // Timer state
    elapsedSeconds: number;
    totalSessionSeconds: number;
    timerDuration: number; // Duration for the current exercise (default 60s)
    
    // Tracking
    completedExerciseIds: string[];
    completedExerciseNames: string[];

    // Actions
    startWorkout: (programId: string, dayId: string, userId?: string) => void;
    resumeOldWorkout: (log: WorkoutLog) => void;
    pauseWorkout: () => void;
    resumeWorkout: () => void;
    finishWorkout: () => Promise<void>;
    cancelWorkout: () => void;
    setIsMinimized: (isMinimized: boolean) => void;

    setExerciseIndex: (index: number) => void;
    nextExercise: (maxIndex: number) => void;
    prevExercise: () => void;
    markExerciseCompleted: (exerciseId: string, exerciseName?: string) => void;

    scaleIntensity: (intensity: 'light' | 'standard' | 'intense') => void;
    swapToRecovery: () => void;

    tick: () => void; // Increment elapsed seconds
    resetTimer: () => void;

    // AI/Voice logging
    exerciseLogs: Record<string, { reps?: number, weight?: number, rpe?: number, name?: string }[]>;
    logExerciseSet: (programId: string, dayId: string, exerciseIndex: number, reps: number, weight: number, rpe?: number, exerciseName?: string) => void;
    
    // Achievement badges
    lastBadgeUrl: string | null;
    badgePrompt: string | null;
    achievementTitle: string | null;
    achievementSubtitle: string | null;
    lastPhysiquePhotoUrl: string | null;
    setBadgeUrl: (url: string | null) => void;
    
    // Physique capture flow
    completePhysiqueCapture: (photoUrl?: string) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            status: 'idle',
            activeProgramId: null,
            activeDayId: null,
            activeSessionId: null,
            activeExerciseIndex: 0,
            activeIntensity: 'standard',
            isRecoveryMode: false,
            isMinimized: false,
            elapsedSeconds: 0,
            totalSessionSeconds: 0,
            completedExerciseIds: [],
            completedExerciseNames: [],
            timerDuration: 60,

            startWorkout: (programId, dayId, userId = 'guest') => {
                const { activeSessionId, totalSessionSeconds, activeExerciseIndex, completedExerciseIds, completedExerciseNames } = get();
                
                // If there's an active session, implicitly pause it before starting a new one
                if (activeSessionId) {
                    LocalService.logWorkoutEvent(activeSessionId, 'pause');
                    LocalService.updateWorkoutSession(activeSessionId, { 
                        totalTimeSpentSec: totalSessionSeconds,
                        lastExerciseIndex: activeExerciseIndex,
                        completedExerciseIds: completedExerciseIds,
                        completedExerciseNames: completedExerciseNames,
                        isPaused: true
                    });
                }

                const sessionId = LocalService.createWorkoutSession(programId, dayId, userId);
                set({
                    status: 'running',
                    activeProgramId: programId,
                    activeDayId: dayId,
                    activeSessionId: sessionId,
                    activeExerciseIndex: 0,
                    activeIntensity: 'standard',
                    isRecoveryMode: false,
                    isMinimized: false,
                    elapsedSeconds: 0,
                    totalSessionSeconds: 0,
                    completedExerciseIds: [],
                    completedExerciseNames: []
                });
            },

            resumeOldWorkout: (log) => {
                LocalService.logWorkoutEvent(log.sessionId, 'resume');
                // Update the session date to now so the activity feed reflects when it was resumed
                const resumedDate = new Date().toISOString();
                LocalService.updateWorkoutSession(log.sessionId, {
                    isPaused: false,
                    date: resumedDate,
                });
                set({
                    status: 'running',
                    activeProgramId: log.programId,
                    activeDayId: log.dayId,
                    activeSessionId: log.sessionId,
                    activeExerciseIndex: log.lastExerciseIndex || 0,
                    activeIntensity: 'standard',
                    isRecoveryMode: false,
                    isMinimized: false,
                    elapsedSeconds: 0, // start the timer fresh for the resumed exercise
                    totalSessionSeconds: log.totalTimeSpentSec || 0,
                    completedExerciseIds: log.completedExerciseIds || [],
                    completedExerciseNames: log.completedExerciseNames || []
                });
            },

            pauseWorkout: () => {
                const { activeSessionId, totalSessionSeconds, activeExerciseIndex, completedExerciseIds, completedExerciseNames } = get();
                if (activeSessionId) {
                    LocalService.logWorkoutEvent(activeSessionId, 'pause');
                    LocalService.updateWorkoutSession(activeSessionId, { 
                        totalTimeSpentSec: totalSessionSeconds,
                        lastExerciseIndex: activeExerciseIndex,
                        completedExerciseIds: completedExerciseIds,
                        completedExerciseNames: completedExerciseNames,
                        isPaused: true
                    });
                }
                
                set({
                    status: 'idle',
                    activeProgramId: null,
                    activeDayId: null,
                    activeSessionId: null,
                    activeExerciseIndex: 0,
                    isMinimized: false,
                    elapsedSeconds: 0,
                    totalSessionSeconds: 0,
                    completedExerciseIds: [],
                    completedExerciseNames: [],
                    exerciseLogs: {}
                });
            },

            resumeWorkout: () => {
                const { activeSessionId } = get();
                if (activeSessionId) {
                    LocalService.logWorkoutEvent(activeSessionId, 'resume');
                    // Sync the unpaused state and update date to move to top of history
                    LocalService.updateWorkoutSession(activeSessionId, { 
                        isPaused: false,
                        date: new Date().toISOString() 
                    });
                }
                set({ status: 'running' });
            },

            finishWorkout: async () => {
                const { exerciseLogs, activeSessionId } = get();
                const userId = 'guest'; // Can be passed in later, but LocalService calls usually don't strictly need it if just using current session logic

                if (activeSessionId) LocalService.logWorkoutEvent(activeSessionId, 'finish');
                
                let totalVolume = 0;
                let exerciseCount = 0;
                
                const dbLogs: any[] = [];
                Object.entries(exerciseLogs).forEach(([key, sets]) => {
                    const [_prog, _day, exIdxStr] = key.split('-');
                    const exIdx = parseInt(exIdxStr, 10);
                    // We need the exercise ID. Since we only have index, we'd need to fetch the program.
                    // For simplicity in Phase 1 without restructuring, we save the program/day/idx data,
                    // but ideally we'd pass the actual exercise ID during logExerciseSet.
                    // We will save using a composite ID or let the backend know.
                    if (sets.length > 0) exerciseCount++;
                    sets.forEach(set => {
                        totalVolume += (set.reps || 0) * (set.weight || 0);
                        if (userId && userId !== 'guest') {
                            dbLogs.push({
                                user_id: userId,
                                exercise_id: set.name || `prog_${_prog}_idx_${exIdx}`, // Use name for APE matching
                                weight: set.weight || 0,
                                reps: set.reps || 0,
                                sets: 1, // each entry is 1 set
                                rpe: set.rpe, // V1.2 Intelligent Progression
                                performed_at: new Date().toISOString()
                            });
                        }
                    });
                });
                
                if (dbLogs.length > 0) {
                    supabase.from('exercise_logs').insert(dbLogs).then(({error}) => {
                        if (error) console.error("Failed to push exercise_logs to Supabase APE:", error);
                    });
                }

                const streak = await LocalService.getCurrentStreak(userId);
                let title = "BEAST MODE";
                let subtitle = "NEW ACHIEVEMENT UNLOCKED";

                if (streak > 0 && streak % 5 === 0) {
                    title = `${streak} DAY STREAK!`;
                    subtitle = "DEDICATION BADGE UNLOCKED";
                } else if (totalVolume > 10000) {
                    title = "10K VOLUME CLUB";
                    subtitle = "STRENGTH BADGE UNLOCKED";
                }

                const prompt = `A hyper-realistic 3D digital gold badge, futuristic gym trophy aesthetic, centered, dark glowing background, representing a completed workout with ${exerciseCount} exercises and ${totalVolume.toLocaleString()} lbs total volume lifted. Highly detailed 8k render, Unreal Engine 5 style. Text saying "${title}".`;
                
                set({ 
                    status: 'physique_capture', 
                    badgePrompt: prompt,
                    achievementTitle: title,
                    achievementSubtitle: subtitle,
                    exerciseLogs: {} // clear logs on finish
                });
                if (activeSessionId) {
                    LocalService.updateWorkoutSession(activeSessionId, { isPaused: false });
                }
            },

            cancelWorkout: () => {
                const { activeSessionId, totalSessionSeconds, activeExerciseIndex, completedExerciseIds, completedExerciseNames } = get();
                if (activeSessionId) {
                    LocalService.logWorkoutEvent(activeSessionId, 'cancel');
                    LocalService.updateWorkoutSession(activeSessionId, { 
                        totalTimeSpentSec: totalSessionSeconds,
                        lastExerciseIndex: activeExerciseIndex,
                        completedExerciseIds: completedExerciseIds,
                        completedExerciseNames: completedExerciseNames,
                        isPaused: false
                    });
                }
                
                set({
                    status: 'idle',
                    activeProgramId: null,
                    activeDayId: null,
                    activeSessionId: null,
                    activeExerciseIndex: 0,
                    isMinimized: false,
                    elapsedSeconds: 0,
                    totalSessionSeconds: 0,
                    completedExerciseIds: [],
                    completedExerciseNames: [],
                    exerciseLogs: {} // clear logs on cancel
                });
            },

            setIsMinimized: (isMinimized) => set({ isMinimized }),

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
                    get().finishWorkout();
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

            markExerciseCompleted: (exerciseId, exerciseName) => {
                set((state) => {
                    const hasId = state.completedExerciseIds.includes(exerciseId);
                    return {
                        completedExerciseIds: hasId 
                            ? state.completedExerciseIds 
                            : [...state.completedExerciseIds, exerciseId],
                        completedExerciseNames: (hasId || !exerciseName)
                            ? state.completedExerciseNames
                            : [...state.completedExerciseNames, exerciseName]
                    };
                });
            },

            scaleIntensity: (intensity) => set({ activeIntensity: intensity }),

            swapToRecovery: () => set({
                isRecoveryMode: true,
                activeExerciseIndex: 0,
                elapsedSeconds: 0
                // Implementation note: The UI will handle the actual exercise replacement
                // based on this flag.
            }),

            tick: () => set((state) => ({ 
                elapsedSeconds: state.elapsedSeconds + 1,
                totalSessionSeconds: state.totalSessionSeconds + 1 
            })),

            resetTimer: () => set({ elapsedSeconds: 0 }),

            exerciseLogs: {},
            logExerciseSet: (programId, dayId, exerciseIndex, reps, weight, rpe, exerciseName) => {
                // Input validation: ensure no negative reps or weights
                const validReps = Math.max(0, reps);
                const validWeight = Math.max(0, weight);
                const validRpe = rpe !== undefined ? Math.max(1, Math.min(10, rpe)) : undefined;
                
                const key = `${programId}-${dayId}-${exerciseIndex}`;
                set((state) => {
                    const currentLogs = state.exerciseLogs[key] || [];
                    return {
                        exerciseLogs: {
                            ...state.exerciseLogs,
                            [key]: [...currentLogs, { reps: validReps, weight: validWeight, rpe: validRpe, name: exerciseName }]
                        }
                    };
                });
            },

            lastBadgeUrl: null,
            lastPhysiquePhotoUrl: null,
            badgePrompt: null,
            achievementTitle: null,
            achievementSubtitle: null,
            setBadgeUrl: (url) => set({ lastBadgeUrl: url }),

            completePhysiqueCapture: (photoUrl) => {
                const { activeSessionId } = get();
                if (activeSessionId && photoUrl) {
                    LocalService.updateWorkoutSession(activeSessionId, { physiquePhotoUrl: photoUrl });
                }
                set({ status: 'finished', lastPhysiquePhotoUrl: photoUrl || null });
            }
        }),
        {
            name: 'juuk-workout-storage', // key in local storage
            partialize: (state) => ({
                // Persist only these fields to survive refreshes
                status: state.status,
                activeProgramId: state.activeProgramId,
                activeDayId: state.activeDayId,
                activeSessionId: state.activeSessionId,
                activeExerciseIndex: state.activeExerciseIndex,
                elapsedSeconds: state.elapsedSeconds,
                totalSessionSeconds: state.totalSessionSeconds,
                completedExerciseIds: state.completedExerciseIds,
                completedExerciseNames: state.completedExerciseNames,
                lastPhysiquePhotoUrl: state.lastPhysiquePhotoUrl
            }),
        }
    )
);
