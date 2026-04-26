const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800";

export const DEFAULT_PROGRAMS: Record<string, Omit<WorkoutProgram, 'id' | 'userId' | 'version' | 'isPublic'>> = {
    gym: {
        title: "Gym Strength & Muscle",
        icon: "dumbbell",
        description: "Focus on compound lifts and hypertrophy using gym equipment.",
        colorTheme: "blue",
        schedule: [
            { 
                id: 'mon', dayOfWeek: 'Monday', title: 'Push (Chest, Shoulders, Triceps)', durationMin: 60, type: 'strength', 
                slots: [
                    { id: 's1', type: 'normal', entries: [{ id: '1', exerciseId: 'ex1', name: 'Barbell Bench Press', targetSets: 3, targetReps: '8-10', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's2', type: 'normal', entries: [{ id: '2', exerciseId: 'ex2', name: 'Overhead Press', targetSets: 3, targetReps: '8-12', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's3', type: 'normal', entries: [{ id: '3', exerciseId: 'ex3', name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '10-12', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's4', type: 'normal', entries: [{ id: '4', exerciseId: 'ex4', name: 'Lateral Raises', targetSets: 3, targetReps: '15', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's5', type: 'normal', entries: [{ id: '5', exerciseId: 'ex5', name: 'Tricep Pushdowns', targetSets: 3, targetReps: '15', imageUrl: PLACEHOLDER_IMAGE }] }
                ]
            },
            { 
                id: 'tue', dayOfWeek: 'Tuesday', title: 'Pull (Back, Biceps)', durationMin: 60, type: 'strength', 
                slots: [
                    { id: 's6', type: 'normal', entries: [{ id: '6', exerciseId: 'ex6', name: 'Lat Pulldowns', targetSets: 3, targetReps: '8-10', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's7', type: 'normal', entries: [{ id: '7', exerciseId: 'ex7', name: 'Cable Rows', targetSets: 3, targetReps: '10-12', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's8', type: 'normal', entries: [{ id: '8', exerciseId: 'ex8', name: 'Face Pulls', targetSets: 3, targetReps: '15', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's9', type: 'normal', entries: [{ id: '9', exerciseId: 'ex9', name: 'Bicep Curls', targetSets: 3, targetReps: '10-12', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's10', type: 'normal', entries: [{ id: '10', exerciseId: 'ex10', name: 'Hammer Curls', targetSets: 3, targetReps: '12', imageUrl: PLACEHOLDER_IMAGE }] }
                ]
            },
            { id: 'wed', dayOfWeek: 'Wednesday', title: 'Active Recovery', durationMin: 30, type: 'rest', slots: [] },
            { 
                id: 'thu', dayOfWeek: 'Thursday', title: 'Legs (Quads, Hams)', durationMin: 60, type: 'strength', 
                slots: [
                    { id: 's14', type: 'normal', entries: [{ id: '14', exerciseId: 'ex14', name: 'Squats', targetSets: 3, targetReps: '8-10', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's15', type: 'normal', entries: [{ id: '15', exerciseId: 'ex15', name: 'RDLs', targetSets: 3, targetReps: '10-12', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's16', type: 'normal', entries: [{ id: '16', exerciseId: 'ex16', name: 'Leg Press', targetSets: 3, targetReps: '12', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's17', type: 'normal', entries: [{ id: '17', exerciseId: 'ex17', name: 'Leg Curls', targetSets: 3, targetReps: '15', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's18', type: 'normal', entries: [{ id: '18', exerciseId: 'ex18', name: 'Calf Raises', targetSets: 4, targetReps: '15', imageUrl: PLACEHOLDER_IMAGE }] }
                ]
            },
            { 
                id: 'fri', dayOfWeek: 'Friday', title: 'Full Body Weak Points', durationMin: 50, type: 'strength', 
                slots: [
                    { id: 's19', type: 'normal', entries: [{ id: '19', exerciseId: 'ex19', name: 'Dumbbell Press', targetSets: 3, targetReps: '10', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's20', type: 'normal', entries: [{ id: '20', exerciseId: 'ex20', name: 'Pull-ups', targetSets: 3, targetReps: '10', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's21', type: 'normal', entries: [{ id: '21', exerciseId: 'ex21', name: 'Goblet Squats', targetSets: 3, targetReps: '12', imageUrl: PLACEHOLDER_IMAGE }] },
                    { id: 's22', type: 'normal', entries: [{ id: '22', exerciseId: 'ex22', name: 'Pushups', targetSets: 3, targetReps: 'Failure', imageUrl: PLACEHOLDER_IMAGE }] }
                ]
            },
            { id: 'sat', dayOfWeek: 'Saturday', title: 'Cardio', durationMin: 45, type: 'cardio', slots: [] },
            { id: 'sun', dayOfWeek: 'Sunday', title: 'Rest', durationMin: 0, type: 'rest', slots: [] }
        ]
    },
    home: {
        title: "Home Bodyweight",
        icon: "home",
        description: "No equipment needed. Uses body weight for resistance.",
        colorTheme: "emerald",
        schedule: [
            { id: 'mon', dayOfWeek: 'Monday', title: 'Full Body A', durationMin: 40, type: 'strength', slots: [{ id: 's26', type: 'normal', entries: [{ id: '26', exerciseId: 'ex26', name: 'Jumping Jacks', targetSets: 1, targetReps: '2m', imageUrl: PLACEHOLDER_IMAGE }] }, { id: 's27', type: 'normal', entries: [{ id: '27', exerciseId: 'ex27', name: 'Squats', targetSets: 3, targetReps: '15', imageUrl: PLACEHOLDER_IMAGE }] }] },
            { id: 'sun', dayOfWeek: 'Sunday', title: 'Rest', durationMin: 0, type: 'rest', slots: [] }
        ]
    },
    cardio: {
        title: "Cardio & Tone",
        icon: "flame",
        description: "High energy focus on endurance and calorie burning.",
        colorTheme: "orange",
        schedule: [
            { id: 'mon', dayOfWeek: 'Monday', title: 'HIIT Intervals', durationMin: 30, type: 'cardio', slots: [{ id: 's50', type: 'normal', entries: [{ id: '50', exerciseId: 'ex50', name: 'Warm-up: Light Jog', targetSets: 1, targetReps: '5 min', imageUrl: PLACEHOLDER_IMAGE }] }] },
            { id: 'sun', dayOfWeek: 'Sunday', title: 'Deep Stretch / Rest', durationMin: 20, type: 'rest', slots: [] }
        ]
    }
};
