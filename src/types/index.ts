/**
 * @file src/types/index.ts
 * @description Central TypeScript interface definitions for PlanR.
 *
 * Contains data shapes that flow through the app — from user auth models,
 * workout programs and days, down to individual exercise logs. All components,
 * services, and stores import from here to ensure consistency.
 */

// Re-export the exercise-library type so consumers can import from one place.
export type { DbExercise } from '../services/exerciseService';
export type { DeloadResult } from '../engine/types';

export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'strength' | 'maintenance';

/** Represents an authenticated or guest user of the app. */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  avatarUrl?: string;
  /** True if the user chose "Continue as Guest" rather than signing in. */
  isGuest?: boolean;
}

/** Extended user profile stored in Supabase for synced preferences. */
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
  /** Adaptive Performance Engine fields */
  training_mode?: 'casual' | 'serious';
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  mev_multiplier?: number;
  mrv_multiplier?: number;
  primary_fitness_goal?: FitnessGoal;
  createdAt: Date;
}

/** A single exercise entry within a workout slot. */
export interface WorkoutEntry {
  id: string;
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: string;
  /** Optional starting weight in kg/lbs. */
  weight?: number;
  /** Optional rest time in seconds between sets. */
  restTimeSec?: number;
  /** Coach notes visible to the user. */
  notes?: string;
  /** REQUIRED: UI instructional image or GIF. */
  imageUrl: string;
  /** Primary muscle group targeted by this exercise. */
  primaryMuscle?: string;
  /** Whether the entry has been marked complete in the active session. */
  isCompleted?: boolean;
}

/** 
 * A collection of exercises performed together. 
 * If entries.length > 1, it functions as a superset.
 */
export interface WorkoutSlot {
  id: string;
  type: 'normal' | 'superset' | 'circleset' | 'dropset';
  entries: WorkoutEntry[];
}

/** A single day's workout block inside a workout program schedule. */
export interface WorkoutDay {
  id: string;
  title: string;
  dayOfWeek: string;
  type: 'strength' | 'cardio' | 'rest' | 'active_recovery';
  durationMin: number;
  /** REFACTORED: Now uses Slots instead of a flat Exercise list. */
  slots: WorkoutSlot[];
}

/** A full user-defined workout program with a weekly schedule. */
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

/**
 * A recorded workout session log — created when a session starts and updated
 * as the user completes exercises, pauses, or finishes.
 */
export interface WorkoutLog {
  /** The unique ID of this log entry. */
  id: string;
  /** Links multiple events (start, pause, resume, finish) to the same session. */
  sessionId: string;
  userId: string;
  programId: string;
  dayId: string;
  /** ISO timestamp of when the session started. */
  date: string;
  /** IDs of exercises the user completed. */
  completedExerciseIds: string[];
  /** Human-readable names of completed exercises for display in the Activity Feed. */
  completedExerciseNames?: string[];
  /** Total seconds elapsed including all pauses and resumes. */
  totalTimeSpentSec: number;
  /** Null if the session was not finished, ISO string if completed successfully. */
  completedAt: any;
  /** Optional URL to a physique progress photo taken after this session. */
  physiquePhotoUrl?: string;
  /** Exercise index the user was on when the session was last paused/canceled. */
  lastExerciseIndex?: number;
  /**
   * If true, this session was explicitly paused (not cancelled/abandoned).
   * Paused sessions show a yellow badge in the Activity Feed and can be resumed.
   */
  isPaused?: boolean;
  /** Ordered list of lifecycle events emitted during the session. */
  events?: { type: 'start' | 'pause' | 'resume' | 'finish' | 'cancel', timestamp: number }[];
}
