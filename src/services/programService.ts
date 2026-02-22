import { LocalService } from './localService';
import type { WorkoutProgram, WorkoutLog } from '../types';

// Default programs data (moved here for seeding)
const DEFAULT_PROGRAMS: Record<string, Omit<WorkoutProgram, 'id' | 'userId' | 'version' | 'isPublic'>> = {
    gym: {
        title: "Gym Strength & Muscle",
        icon: "dumbbell",
        description: "Focus on compound lifts and hypertrophy using gym equipment.",
        colorTheme: "blue",
        schedule: [
            { id: 'mon', dayOfWeek: 'Monday', title: 'Push (Chest, Shoulders, Triceps)', durationMin: 60, type: 'strength', exercises: [{ id: '1', name: 'Barbell Bench Press', targetSets: 3, targetReps: '8-10' }, { id: '2', name: 'Overhead Press', targetSets: 3, targetReps: '8-12' }, { id: '3', name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '10-12' }, { id: '4', name: 'Lateral Raises', targetSets: 3, targetReps: '15' }, { id: '5', name: 'Tricep Pushdowns', targetSets: 3, targetReps: '15' }] },
            { id: 'tue', dayOfWeek: 'Tuesday', title: 'Pull (Back, Biceps)', durationMin: 60, type: 'strength', exercises: [{ id: '6', name: 'Lat Pulldowns', targetSets: 3, targetReps: '8-10' }, { id: '7', name: 'Cable Rows', targetSets: 3, targetReps: '10-12' }, { id: '8', name: 'Face Pulls', targetSets: 3, targetReps: '15' }, { id: '9', name: 'Bicep Curls', targetSets: 3, targetReps: '10-12' }, { id: '10', name: 'Hammer Curls', targetSets: 3, targetReps: '12' }] },
            { id: 'wed', dayOfWeek: 'Wednesday', title: 'Active Recovery', durationMin: 30, type: 'rest', exercises: [{ id: '11', name: 'Light Walk', targetSets: 1, targetReps: '20-30 mins' }, { id: '12', name: 'Stretching / Yoga', targetSets: 1, targetReps: '15 mins' }, { id: '13', name: 'Foam Rolling', targetSets: 1, targetReps: '15 mins' }] },
            { id: 'thu', dayOfWeek: 'Thursday', title: 'Legs (Quads, Hams)', durationMin: 60, type: 'strength', exercises: [{ id: '14', name: 'Squats', targetSets: 3, targetReps: '8-10' }, { id: '15', name: 'RDLs', targetSets: 3, targetReps: '10-12' }, { id: '16', name: 'Leg Press', targetSets: 3, targetReps: '12' }, { id: '17', name: 'Leg Curls', targetSets: 3, targetReps: '15' }, { id: '18', name: 'Calf Raises', targetSets: 4, targetReps: '15' }] },
            { id: 'fri', dayOfWeek: 'Friday', title: 'Full Body Weak Points', durationMin: 50, type: 'strength', exercises: [{ id: '19', name: 'Dumbbell Press', targetSets: 3, targetReps: '10' }, { id: '20', name: 'Pull-ups', targetSets: 3, targetReps: '10' }, { id: '21', name: 'Goblet Squats', targetSets: 3, targetReps: '12' }, { id: '22', name: 'Pushups', targetSets: 3, targetReps: 'Failure' }] },
            { id: 'sat', dayOfWeek: 'Saturday', title: 'Cardio', durationMin: 45, type: 'cardio', exercises: [{ id: '23', name: 'Steady State Run/Bike', targetSets: 1, targetReps: '30 mins' }, { id: '24', name: 'HIIT Sprints', targetSets: 1, targetReps: '15 mins' }] },
            { id: 'sun', dayOfWeek: 'Sunday', title: 'Rest', durationMin: 0, type: 'rest', exercises: [{ id: '25', name: 'Rest & Meal Prep', targetSets: 1, targetReps: 'N/A' }] }
        ]
    },
    home: {
        title: "Home Bodyweight",
        icon: "home",
        description: "No equipment needed. Uses body weight for resistance.",
        colorTheme: "emerald",
        schedule: [
            { id: 'mon', dayOfWeek: 'Monday', title: 'Full Body A', durationMin: 40, type: 'strength', exercises: [{ id: '26', name: 'Jumping Jacks', targetSets: 1, targetReps: '2m' }, { id: '27', name: 'Squats', targetSets: 3, targetReps: '15' }, { id: '28', name: 'Pushups', targetSets: 3, targetReps: '12' }, { id: '29', name: 'Lunges', targetSets: 3, targetReps: '12' }, { id: '30', name: 'Plank', targetSets: 3, targetReps: '45s' }] },
            { id: 'tue', dayOfWeek: 'Tuesday', title: 'Core & Cardio', durationMin: 35, type: 'cardio', exercises: [{ id: '31', name: 'High Knees', targetSets: 3, targetReps: '45s' }, { id: '32', name: 'Burpees', targetSets: 3, targetReps: '10' }, { id: '33', name: 'Bicycle Crunches', targetSets: 3, targetReps: '20' }, { id: '34', name: 'Leg Raises', targetSets: 3, targetReps: '15' }] },
            { id: 'wed', dayOfWeek: 'Wednesday', title: 'Lower Body', durationMin: 40, type: 'strength', exercises: [{ id: '35', name: 'Glute Bridges', targetSets: 4, targetReps: '20' }, { id: '36', name: 'Split Squats', targetSets: 3, targetReps: '10' }, { id: '37', name: 'Calf Raises', targetSets: 4, targetReps: '20' }, { id: '38', name: 'Wall Sit', targetSets: 3, targetReps: '45s' }] },
            { id: 'thu', dayOfWeek: 'Thursday', title: 'Active Recovery', durationMin: 30, type: 'rest', exercises: [{ id: '39', name: 'Brisk Walk', targetSets: 1, targetReps: '30m' }, { id: '40', name: 'Stretching', targetSets: 1, targetReps: '15m' }] },
            { id: 'fri', dayOfWeek: 'Friday', title: 'Upper Body', durationMin: 40, type: 'strength', exercises: [{ id: '41', name: 'Pike Pushups', targetSets: 3, targetReps: '8' }, { id: '42', name: 'Tricep Dips', targetSets: 3, targetReps: '12' }, { id: '43', name: 'Wide Pushups', targetSets: 3, targetReps: '12' }, { id: '44', name: 'Superman Holds', targetSets: 3, targetReps: '15' }] },
            { id: 'sat', dayOfWeek: 'Saturday', title: 'Full Body B', durationMin: 45, type: 'strength', exercises: [{ id: '45', name: 'Jump Squats', targetSets: 3, targetReps: '15' }, { id: '46', name: 'Inchworms', targetSets: 3, targetReps: '10' }, { id: '47', name: 'Pushup Rotations', targetSets: 3, targetReps: '10' }, { id: '48', name: 'Curtsy Lunges', targetSets: 3, targetReps: '12' }] },
            { id: 'sun', dayOfWeek: 'Sunday', title: 'Rest', durationMin: 0, type: 'rest', exercises: [{ id: '49', name: 'Hydrate & Sleep', targetSets: 1, targetReps: 'N/A' }] }
        ]
    },
    cardio: {
        title: "Cardio & Tone",
        icon: "flame",
        description: "High energy focus on endurance and calorie burning.",
        colorTheme: "orange",
        schedule: [
            { id: 'mon', dayOfWeek: 'Monday', title: 'HIIT Intervals', durationMin: 30, type: 'cardio', exercises: [{ id: '50', name: 'Warm-up: Light Jog', targetSets: 1, targetReps: '5 min' }, { id: '51', name: 'Sprint 30s / Walk 30s', targetSets: 10, targetReps: '1 min' }, { id: '52', name: 'Cool down: Walk', targetSets: 1, targetReps: '5 min' }] },
            { id: 'tue', dayOfWeek: 'Tuesday', title: 'Steady State Cardio', durationMin: 45, type: 'cardio', exercises: [{ id: '53', name: 'Jog, Cycle, or Swim (Zone 2)', targetSets: 1, targetReps: '45 min' }] },
            { id: 'wed', dayOfWeek: 'Wednesday', title: 'Core & Mobility', durationMin: 40, type: 'strength', exercises: [{ id: '54', name: 'Plank', targetSets: 3, targetReps: '60s' }, { id: '55', name: 'Dead Bugs', targetSets: 3, targetReps: '12' }, { id: '56', name: 'Bird Dogs', targetSets: 3, targetReps: '12' }, { id: '57', name: 'Yoga Flow', targetSets: 1, targetReps: '20 mins' }] },
            { id: 'thu', dayOfWeek: 'Thursday', title: 'Hills / Resistance Cardio', durationMin: 40, type: 'cardio', exercises: [{ id: '58', name: 'Warm up', targetSets: 1, targetReps: '5 min' }, { id: '59', name: 'Incline Walking / Hill Run', targetSets: 1, targetReps: '20 mins' }, { id: '60', name: 'Stair Climber', targetSets: 1, targetReps: '10 mins' }, { id: '61', name: 'Cool down', targetSets: 1, targetReps: '5 min' }] },
            { id: 'fri', dayOfWeek: 'Friday', title: 'Full Body Conditioning', durationMin: 45, type: 'strength', exercises: [{ id: '62', name: 'Kettlebell Swings', targetSets: 4, targetReps: '15' }, { id: '63', name: 'Box Jumps', targetSets: 3, targetReps: '12' }, { id: '64', name: 'Burpees', targetSets: 3, targetReps: '10' }, { id: '65', name: 'Jump Rope', targetSets: 5, targetReps: '2 mins' }] },
            { id: 'sat', dayOfWeek: 'Saturday', title: 'Long Distance Activity', durationMin: 60, type: 'cardio', exercises: [{ id: '66', name: 'Hiking / Sport / Long Ride', targetSets: 1, targetReps: '60+ min' }] },
            { id: 'sun', dayOfWeek: 'Sunday', title: 'Deep Stretch / Rest', durationMin: 20, type: 'rest', exercises: [{ id: '67', name: 'Full body foam rolling', targetSets: 1, targetReps: '10 min' }, { id: '68', name: 'Static stretching', targetSets: 1, targetReps: '10 min' }] }
        ]
    }
};
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
