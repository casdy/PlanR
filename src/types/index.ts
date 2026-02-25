export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  avatarUrl?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences: {
    darkMode: boolean;
    activeProgramId: string;
    timerDuration: number;
  };
  createdAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  restTimeSec?: number;
  notes?: string;
  isCompleted?: boolean;
}

export interface WorkoutDay {
  id: string;
  title: string;
  dayOfWeek: string;
  type: 'strength' | 'cardio' | 'rest' | 'active_recovery';
  durationMin: number;
  exercises: Exercise[];
}

export interface WorkoutProgram {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  colorTheme: string;
  schedule: WorkoutDay[];
  isPublic: boolean;
  version: number;
}

export interface WorkoutLog {
  id: string; // The specific log ID
  sessionId: string; // The continuous session ID (links starts, pauses, etc)
  userId: string;
  programId: string;
  dayId: string;
  date: string;
  completedExerciseIds: string[];
  totalTimeSpentSec: number;
  completedAt: any;
  lastExerciseIndex?: number;
  events?: { type: 'start' | 'pause' | 'resume' | 'finish' | 'cancel', timestamp: number }[];
}
