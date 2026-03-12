import type { ExerciseLog } from './types';
import type { FitnessGoal } from '../types';

/**
 * Adaptive Performance Engine - Volume Engine (Phase 1.2+)
 * 
 * Responsible for calculating weekly volume per muscle group and comparing against MEV/MRV.
 */
export function calculateWeeklyVolume(
  logs: ExerciseLog[],
  exerciseToMuscleMap: Record<string, string> = {}
): Record<string, number> {
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  const volumeByMuscle: Record<string, number> = {};

  logs.forEach(log => {
    const logTime = new Date(log.performed_at).getTime();
    if (now - logTime <= ONE_WEEK_MS) {
      const volume = log.weight * log.reps * log.sets;
      // In V1.2, exercise_id might directly be the exercise name, 
      // or we use the passed in map. Default to 'General' if unknown.
      const muscle = exerciseToMuscleMap[log.exercise_id] || 'General';
      
      if (!volumeByMuscle[muscle]) {
        volumeByMuscle[muscle] = 0;
      }
      volumeByMuscle[muscle] += volume;
    }
  });

  return volumeByMuscle;
}

/**
 * Checks if a muscle group is approaching or exceeding Maximum Recoverable Volume (MRV).
 * If goal is 'muscle_gain', the threshold is pushed closer to MRV.
 */
export function checkMRVThreshold(
  muscleVolume: number, 
  goal: FitnessGoal = 'maintenance',
  mrvThreshold = 10000 // default baseline MRV
) {
  // If gaining muscle, we want to push closer to MRV, so maybe we flag "approaching" later?
  // Actually PRD says: "pushes the volumeEngine closer to the user's Maximum Recoverable Volume (MRV)"
  // This could mean we adjust the threshold or the recommendation.
  const adjustedMRV = goal === 'muscle_gain' ? mrvThreshold * 1.1 : mrvThreshold;

  return { 
    approachingMRV: muscleVolume >= adjustedMRV * 0.8, 
    exceededMRV: muscleVolume > adjustedMRV 
  };
}
