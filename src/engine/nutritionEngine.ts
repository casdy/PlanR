/**
 * @file src/engine/nutritionEngine.ts
 * @description Calculates the user's daily macro totals from the `nutrition_logs` Supabase table.
 *
 * - getDailyNutritionTotals: sums all logged macros for the current calendar day.
 * - logNutrition: inserts a new nutrition log row for the authed user.
 */
import { supabase } from '../lib/supabase';

export interface DailyNutritionTotals {
  calories: number;
  protein: number;   // grams
  carbs: number;     // grams
  fat: number;       // grams
  logCount: number;  // number of entries today
}

export interface NutritionLogEntry {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Basic UUID validation helper
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Fetch and sum all nutrition logs for the authenticated user on a specific date (UTC).
 * Returns zeroed totals if no logs exist yet.
 */
export async function getDailyNutritionTotals(userId: string, date: Date = new Date()): Promise<DailyNutritionTotals> {
  if (!isUUID(userId)) {
    console.warn('[nutritionEngine] Invalid UUID for daily totals, skipping query:', userId);
    return { calories: 0, protein: 0, carbs: 0, fat: 0, logCount: 0 };
  }

  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('calories, protein, carbs, fat')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (error) {
    console.error('[nutritionEngine] Failed to fetch daily nutrition totals:', error);
    return { calories: 0, protein: 0, carbs: 0, fat: 0, logCount: 0 };
  }

  const totals = (data || []).reduce(
    (acc: DailyNutritionTotals, row) => ({
      calories: acc.calories + (row.calories ?? 0),
      protein: acc.protein + (row.protein ?? 0),
      carbs: acc.carbs + (row.carbs ?? 0),
      fat: acc.fat + (row.fat ?? 0),
      logCount: acc.logCount + 1,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, logCount: 0 }
  );

  return {
    calories: parseFloat(totals.calories.toFixed(1)),
    protein: parseFloat(totals.protein.toFixed(1)),
    carbs: parseFloat(totals.carbs.toFixed(1)),
    fat: parseFloat(totals.fat.toFixed(1)),
    logCount: totals.logCount,
  };
}

/**
 * Insert a new nutrition log entry into the `nutrition_logs` table.
 */
export async function logNutrition(
  userId: string,
  entry: NutritionLogEntry
): Promise<{ success: boolean; error?: string }> {
  if (!isUUID(userId)) {
    console.warn('[nutritionEngine] Cannot log to Supabase with invalid UUID:', userId);
    return { success: false, error: 'Cannot log data in guest mode.' };
  }

  const { error } = await supabase.from('nutrition_logs').insert({
    user_id: userId,
    food_name: entry.food_name,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
  });

  if (error) {
    console.error('[nutritionEngine] Failed to log nutrition:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Search the user's past nutrition logs for a specific food name.
 * Returns unique food items with their macros.
 */
export async function searchUserFoodHistory(
  userId: string,
  query: string
): Promise<Array<NutritionLogEntry & { source: 'database' }>> {
  if (!isUUID(userId) || !query.trim()) return [];

  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('food_name, calories, protein, carbs, fat')
    .eq('user_id', userId)
    .ilike('food_name', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[nutritionEngine] Failed to search user food history:', error);
    return [];
  }

  // Deduplicate by food_name to keep results clean
  const uniqueItems = new Map<string, NutritionLogEntry & { source: 'database' }>();
  (data || []).forEach(item => {
    if (!uniqueItems.has(item.food_name)) {
      uniqueItems.set(item.food_name, {
        food_name: item.food_name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        source: 'database'
      });
    }
  });

  return Array.from(uniqueItems.values());
}
