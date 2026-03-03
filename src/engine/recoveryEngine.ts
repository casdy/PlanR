import type { RecoveryLog } from './types';

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
