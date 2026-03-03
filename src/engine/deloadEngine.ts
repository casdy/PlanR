import type { ExerciseLog, RecoveryLog } from './types';
import { getBodyweightExercises, type DbExercise } from '../services/wgerService';

/**
 * Adaptive Performance Engine - Deload Engine (Phase 1.3)
 * 
 * Responsible for detecting 3-session fatigue accumulation:
 * - High RPE (>= 9) across recent sessions for a muscle group / average
 * - Poor recovery scores over rolling 7 days
 */

export function detectDeloadTrigger(
  performanceHistory: ExerciseLog[], 
  recoveryHistory: RecoveryLog[]
) {
  let isDeloadRecommended = false;
  let reason = '';
  let fatigueLevel: 'Low' | 'Medium' | 'High' = 'Low';

  // 1. Analyze Recent Recovery (Last 7 Days)
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  const recentRecovery = recoveryHistory.filter(
    log => (now - new Date(log.logged_at).getTime()) <= ONE_WEEK_MS
  );

  let averageRecoveryScore = 10; // Default max
  if (recentRecovery.length > 0) {
    const totalScore = recentRecovery.reduce((acc, log) => {
      // Rough derived score from 1-10 metrics
      const score = (log.sleep_score * 0.3) + ((10 - log.soreness_score) * 0.2) + ((10 - log.stress_score) * 0.2) + (log.energy_score * 0.3);
      return acc + score;
    }, 0);
    averageRecoveryScore = totalScore / recentRecovery.length;
  }

  // 2. Analyze Recent Performance (3-Session Pattern)
  // Get the last 15 logged sets to look for a pattern of high exertion
  const recentLogs = [...performanceHistory]
    .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
    .slice(0, 15);

  const highExertionSets = recentLogs.filter(log => log.rpe && log.rpe >= 9);
  
  if (averageRecoveryScore < 5 || (highExertionSets.length >= 8 && recentLogs.length >= 10)) {
    isDeloadRecommended = true;
    fatigueLevel = 'High';
    reason = averageRecoveryScore < 5 
      ? `Poor average recovery score (${averageRecoveryScore.toFixed(1)}/10) over the last 7 days.`
      : `Consistent high exertion (RPE 9+) detected across recent training sessions.`;
  } else if (averageRecoveryScore < 7 || highExertionSets.length >= 4) {
    fatigueLevel = 'Medium';
    reason = 'Fatigue is accumulating. Monitor recovery carefully.';
  }

  return {
    isDeloadRecommended,
    fatigueLevel,
    reason
  };
}

export function applyDeloadAdjustment<T extends { title: string; exercises: any[] }>(template: T): T {
  // Applies ~10% intensity reduction and drops 1 set per exercise for active recovery.
  const adjustedExercises = template.exercises.map(ex => {
    return {
      ...ex,
      targetSets: Math.max(1, ex.targetSets - 1), // Drop a set, minimum 1
      targetWeight: ex.targetWeight ? parseFloat((ex.targetWeight * 0.9).toFixed(2)) : undefined, // 10% weight drop
    };
  });

  return {
    ...template,
    exercises: adjustedExercises
  };
}

/**
 * Generates a lightweight deload routine from the Supabase exercise library.
 * Uses bodyweight / low-equipment exercises to allow recovery while staying active.
 *
 * @param count  Number of exercises to include (default 5).
 * @returns      Array of DbExercise rows suitable for display in the Dashboard.
 */
export async function generateDeloadRoutine(count = 5): Promise<DbExercise[]> {
  const exercises = await getBodyweightExercises(count * 2); // over-fetch for variety
  // Shuffle and take `count`
  for (let i = exercises.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
  }
  return exercises.slice(0, count);
}
