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
  slots: {
    id: string;
    type: 'normal' | 'superset' | 'dropset';
    entries: {
      id: string;
      name: string;
      targetSets: number;
      targetReps: string;
      targetWeight?: number;
      rpeTarget?: number;
    }[];
  }[];
}

export interface EngineAdjustmentResult {
  adjustedTemplate: WorkoutTemplate;
  adjustmentsMade: string[];
}

export interface DeloadResult {
  isDeloadRecommended: boolean;
  fatigueLevel: 'Low' | 'Medium' | 'High';
  reason: string;
}
