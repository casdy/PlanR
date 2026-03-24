// src/hooks/useMeals.ts
import { useState } from 'react';
import { logNutrition, getDailyNutritionTotals } from '../engine/nutritionEngine';
import { useAuth } from './useAuth';

export function useMeals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMeal = async (meal: { food_name: string; calories: number; protein: number; carbs: number; fat: number }) => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await logNutrition(user.id, meal);
      if (result.success) {
        return true;
      } else {
        setError('Failed to log nutrition');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error logging meal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDailyTotals = async () => {
    if (!user?.id) return null;
    return await getDailyNutritionTotals(user.id);
  };

  return { addMeal, getDailyTotals, loading, error };
}
