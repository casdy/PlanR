export type TrainingMode = 'casual' | 'serious';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseLog {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  sets: number;
  rpe?: number | null;
  performed_at: string;
  created_at?: string;
}

export interface RecoveryLog {
  id: string;
  user_id: string;
  sleep_score: number;    // 1-10
  soreness_score: number; // 1-10
  stress_score: number;   // 1-10
  energy_score: number;   // 1-10
  logged_at: string;
}

export interface WorkoutTemplate {
  // Representation of a day's workout from AI
  id: string;
  title: string;
  exercises: {
    id: string;
    name: string;
    targetSets: number;
    targetReps: string; // e.g., "8-10"
    targetWeight?: number; // optional starting weight based on history
    rpeTarget?: number;    // optional RPE target (serious mode)
  }[];
}

export interface EngineAdjustmentResult {
  adjustedTemplate: WorkoutTemplate;
  adjustmentsMade: string[];
}
