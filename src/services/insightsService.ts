import type { DailyNutritionTotals } from '../engine/nutritionEngine';
import type { NutritionTargets } from '../mobile/types';

/**
 * Deterministic Logic Engine for Generating Personalized Morning Briefings.
 * This analyzes yesterday's macros against daily targets to provide actionable feedback.
 */
export function generateMorningBriefing(
  yesterdayTotals: DailyNutritionTotals,
  targets: NutritionTargets,
  t: (key: any, params?: any) => string
): string {
  if (yesterdayTotals.logCount === 0) {
    return t('briefing_no_log');
  }

  // Calculate Deltas
  const calDiff = yesterdayTotals.calories - targets.calories;
  const calPercent = calDiff / targets.calories; // positive = over, negative = under
  
  const proDiff = yesterdayTotals.protein - targets.protein;
  const proPercent = proDiff / targets.protein;

  const carbsDiff = yesterdayTotals.carbs - targets.carbs;
  const fatDiff = yesterdayTotals.fat - targets.fat;

  // 1. Opening: Overall Calorie Performance
  let opening = '';
  if (Math.abs(calPercent) <= 0.1) {
    opening = t('briefing_spot_on');
  } else if (calPercent > 0.1 && calPercent <= 0.2) {
    opening = t('briefing_slightly_over', { kcal: Math.round(calDiff) });
  } else if (calPercent > 0.2) {
    opening = t('briefing_heavy_day', { kcal: Math.round(calDiff) });
  } else if (calPercent < -0.1 && calPercent >= -0.25) {
    opening = t('briefing_under');
  } else {
    opening = t('briefing_significantly_under');
  }

  // 2. Protein Performance (Crucial for most users)
  let proteinStatement = '';
  if (proPercent >= -0.05) {
    proteinStatement = t('briefing_protein_crushed');
  } else if (proPercent < -0.05 && proPercent >= -0.2) {
    proteinStatement = t('briefing_protein_close', { g: Math.round(Math.abs(proDiff)) });
  } else {
    proteinStatement = t('briefing_protein_short', { g: Math.round(Math.abs(proDiff)) });
  }

  // 3. Carbs/Fat Observation (Only mention if significantly off)
  let extraObservation = '';
  if (carbsDiff > (targets.carbs * 0.25) && fatDiff > (targets.fat * 0.25)) {
    extraObservation = t('briefing_carbs_fat_spike');
  } else if (carbsDiff > (targets.carbs * 0.3)) {
    extraObservation = t('briefing_carb_high');
  } else if (fatDiff > (targets.fat * 0.3)) {
    extraObservation = t('briefing_fat_high');
  }

  return `${opening} ${proteinStatement}${extraObservation}`;
}
