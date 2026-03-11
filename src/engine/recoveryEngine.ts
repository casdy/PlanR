import type { RecoveryLog, TrainingMode } from './types';

/**
 * Calculates a derived recovery score (1-10) based on custom weights.
 * 
 * Formula:
 * Recovery Score = sleep * 0.3 + (10 - soreness) * 0.2 + (10 - stress) * 0.2 + energy * 0.3
 * 
 * Behavior reference:
 * <4 \u2192 reduce volume 20%
 * 4\u20136 \u2192 maintain
 * 7+ \u2192 increase volume 5\u201310%
 */
export function calculateRecoveryScore(log: Partial<RecoveryLog>): number {
  const sleep = log.sleep_score || 5;
  const soreness = log.soreness_score || 5;
  const stress = log.stress_score || 5;
  const energy = log.energy_score || 5;

  const score = 
    (sleep * 0.3) +
    ((10 - soreness) * 0.2) +
    ((10 - stress) * 0.2) +
    (energy * 0.3);

  return parseFloat(score.toFixed(1));
}

// ─── Nutritional Cross-Engine Penalty ──────────────────────────────────────

export interface NutritionPenaltyResult {
  penalizedScore: number;
  warning: string | null;
}

/**
 * Applies a protein-deficiency penalty to the base recovery score.
 *
 * Rules (Serious mode only):
 * - Protein target = bodyWeightKg * 1.6 g/day (minimum performance threshold)
 * - Severely low = logged protein < 60% of target
 * - Penalty: deduct up to 1.5 points, scaled linearly by deficit
 *
 * @param baseScore         - The raw recovery score (1-10)
 * @param loggedProtein     - Grams of protein logged today
 * @param bodyWeightKg      - User's body weight in kg
 * @param trainingMode      - 'casual' | 'serious'
 */
export function applyNutritionPenalty(
  baseScore: number,
  loggedProtein: number,
  bodyWeightKg: number,
  trainingMode: TrainingMode
): NutritionPenaltyResult {
  if (trainingMode !== 'serious' || bodyWeightKg <= 0) {
    return { penalizedScore: baseScore, warning: null };
  }

  const proteinTarget = bodyWeightKg * 1.6; // g/day
  const severeThreshold = proteinTarget * 0.6; // 60% of target

  if (loggedProtein >= severeThreshold) {
    return { penalizedScore: baseScore, warning: null };
  }

  // Scale penalty: 0 at threshold → 1.5 at 0g protein
  const deficit = severeThreshold - loggedProtein;
  const penaltyFraction = deficit / severeThreshold; // 0.0 – 1.0
  const penalty = parseFloat((penaltyFraction * 1.5).toFixed(1));
  const penalizedScore = parseFloat(Math.max(1, baseScore - penalty).toFixed(1));

  const warning = `⚠️ Low protein alert: only ${loggedProtein}g logged today (target ≥${Math.round(proteinTarget)}g for ${bodyWeightKg}kg). Recovery score penalised by ${penalty} pts.`;

  return { penalizedScore, warning };
}

/**
 * Determine immediate volume impact based on recent recovery score
 * Mainly used in Phase 1.2+ for UI feedback
 */
export function getVolumeImpactInsight(score: number): { impact: 'reduce' | 'maintain' | 'increase'; message: string } {
  if (score < 4) {
    return { impact: 'reduce', message: 'Recovery Score: ' + score + '. Volume will be reduced 15-20% next session.' };
  } else if (score >= 4 && score < 7) {
    return { impact: 'maintain', message: 'Recovery Score: ' + score + '. Volume will remain stable.' };
  } else {
    return { impact: 'increase', message: 'Recovery Score: ' + score + '. Optimal recovery detected. Volume may increase 5-10%.' };
  }
}
