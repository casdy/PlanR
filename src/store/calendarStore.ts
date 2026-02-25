import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PlannedWorkout {
    date: string; // ISO date string (YYYY-MM-DD format works well)
    programId: string;
    dayId: string;
}

interface CalendarState {
    plannedWorkouts: PlannedWorkout[];
    addPlannedWorkout: (workout: PlannedWorkout) => void;
    removePlannedWorkout: (date: string) => void;
    getWorkoutForDate: (date: string) => PlannedWorkout | undefined;
    clearAll: () => void;
}

export const useCalendarStore = create<CalendarState>()(
    persist(
        (set, get) => ({
            plannedWorkouts: [],
            
            addPlannedWorkout: (workout) => set((state) => {
                // Remove existing if any for this date to avoid duplicates
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
            name: 'planr-calendar-storage', // unique name for localStorage key
            storage: createJSONStorage(() => localStorage),
        }
    )
);
