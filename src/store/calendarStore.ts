/**
 * @file src/store/calendarStore.ts
 * @description Zustand store for managing the user's scheduled (planned) workout calendar.
 *
 * Stores a list of `PlannedWorkout` entries keyed by date. Each entry maps a
 * calendar date to a specific program + day combination. The store is persisted
 * to localStorage so that planned workouts survive page refreshes.
 *
 * Usage:
 *   const { getWorkoutForDate, addPlannedWorkout } = useCalendarStore();
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Represents a workout scheduled for a specific calendar date. */
export interface PlannedWorkout {
    /** ISO date string e.g. "2026-02-25" */
    date: string;
    programId: string;
    dayId: string;
}

interface CalendarState {
    plannedWorkouts: PlannedWorkout[];
    /** Schedules a workout on a date (replaces an existing plan for that date). */
    addPlannedWorkout: (workout: PlannedWorkout) => void;
    /** Removes the planned workout for the given date. */
    removePlannedWorkout: (date: string) => void;
    /** Returns the planned workout for a date, or undefined if none. */
    getWorkoutForDate: (date: string) => PlannedWorkout | undefined;
    /** Removes all planned workouts from the calendar. */
    clearAll: () => void;
}

export const useCalendarStore = create<CalendarState>()(
    persist(
        (set, get) => ({
            plannedWorkouts: [],
            
            addPlannedWorkout: (workout) => set((state) => {
                // Remove existing entry for the same date to prevent duplicates
                const filtered = state.plannedWorkouts.filter(w => w.date !== workout.date);
                return { plannedWorkouts: [...filtered, workout] };
            }),

            removePlannedWorkout: (date) => set((state) => ({
                plannedWorkouts: state.plannedWorkouts.filter(w => w.date !== date)
            })),

            getWorkoutForDate: (date) => {
                return get().plannedWorkouts.find(w => w.date === date);
            },

            clearAll: () => set({ plannedWorkouts: [] })
        }),
        {
            name: 'planr-calendar-storage', // localStorage key
            storage: createJSONStorage(() => localStorage),
        }
    )
);
