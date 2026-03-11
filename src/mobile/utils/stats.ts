import type { Meal, NutritionTargets } from '../types';

export function calculateNutritionStats(meals: Meal[], targets: NutritionTargets) {
  const totals = meals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fat += meal.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Helper: Calculates score. Under target = % towards target. Over target = gently penalizes overage.
  const getMetricScore = (consumed: number, target: number) => {
    if (target === 0) return 0;
    const ratio = consumed / target;
    return ratio <= 1 ? ratio * 100 : Math.max(0, 100 - ((ratio - 1) * 100));
  };

  const calorieScore = getMetricScore(totals.calories, targets.calories);
  const proteinScore = getMetricScore(totals.protein, targets.protein);
  const carbsScore = getMetricScore(totals.carbs, targets.carbs);
  const fatScore = getMetricScore(totals.fat, targets.fat);

  // Weighted average: Calories 40%, Protein 30%, Carbs 15%, Fat 15%
  const finalScore = (calorieScore * 0.40) + (proteinScore * 0.30) + (carbsScore * 0.15) + (fatScore * 0.15);

  return {
    totals,
    score: Number(finalScore.toFixed(1)),
  };
}
