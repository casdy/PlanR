/**
 * @file src/engine/calorieEngine.ts
 * @description Dynamic Calorie & Macro Engine for PlanR.
 * 
 * Uses the Mifflin-St. Jeor equation to calculate BMR and adjusts TDEE 
 * based on daily activity logs and weight goals.
 */
import { supabase } from '../lib/supabase';
import type { FitnessGoal } from '../types';

// Basic UUID validation helper
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export interface UserBiometrics {
  id: string;
  user_id: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  sex: 'male' | 'female';
  goal_weight_kg: number;
  weekly_goal_rate: number; // e.g., -0.5 for loss, +0.5 for gain
  primary_fitness_goal?: FitnessGoal;
  created_at?: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string;
  waist_cm?: number;
  chest_cm?: number;
  left_bicep_cm?: number;
  right_bicep_cm?: number;
  body_fat_percentage?: number;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  date: string;
  activity_multiplier: number;
  notes?: string;
}

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
};

export const LBS_TO_KG = 0.453592;
export const KG_TO_LBS = 2.20462;

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St. Jeor equation.
 */
export function calculateBMR(bio: UserBiometrics): number {
  const { weight_kg, height_cm, age, sex } = bio;
  if (sex === 'male') {
    return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  }
  return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 */
export function calculateTDEE(bmr: number, multiplier: number): number {
  return bmr * multiplier;
}

/**
 * Calculates today's calorie target based on TDEE and weekly goal rate.
 * 1lb of fat is approximately 3500 calories.
 * Daily deficit/surplus = (weekly_goal_rate [lbs/week] * 3500) / 7
 */
export function getTodaysCalorieTarget(tdee: number, weeklyGoalRate: number): number {
  const dailyAdjustment = (weeklyGoalRate * 3500) / 7;
  return Math.round(tdee + dailyAdjustment);
}

/**
 * Fetches user biometrics from Supabase.
 */
export async function getUserBiometrics(userId: string): Promise<UserBiometrics | null> {
  if (!isUUID(userId)) {
    console.debug('[calorieEngine] Skipping biometrics fetch for non-UUID user:', userId);
    return null;
  }

  const { data, error } = await supabase
    .from('user_biometrics')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle(); // Switch to maybeSingle to avoid 406 errors when not found

  if (error) {
    if (error.code !== 'PGRST116') { 
      console.error('[calorieEngine] Failed to fetch biometrics. Error Detail:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    }
    return null;
  }
  return data;
}

/**
 * Fetches the activity multiplier for a specific date or defaults to sedentary (1.2).
 */
export async function getActivityMultiplier(userId: string, date: string): Promise<number> {
  if (!isUUID(userId)) return ACTIVITY_MULTIPLIERS.sedentary;

  const { data, error } = await supabase
    .from('daily_activity_logs')
    .select('activity_multiplier')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error || !data) {
    return ACTIVITY_MULTIPLIERS.sedentary;
  }
  return data.activity_multiplier;
}

/**
 * Master function to get today's nutrition plan.
 * PRD: Engine must query daily_activity_logs for the previous day's multiplier.
 */
export async function getNutritionPlan(userId: string) {
  const biometrics = await getUserBiometrics(userId);
  if (!biometrics) return null;

  // Get previous day's date string in YYYY-MM-DD
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const lastMultiplier = await getActivityMultiplier(userId, yesterdayStr);
  const bmr = calculateBMR(biometrics);
  const tdee = calculateTDEE(bmr, lastMultiplier);
  const targetCalories = getTodaysCalorieTarget(tdee, biometrics.weekly_goal_rate);

  // Default macro splits (Protein: 30%, Carbs: 40%, Fat: 30%)
  // 1g Protein = 4 cal, 1g Carb = 4 cal, 1g Fat = 9 cal
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    protein: Math.round((targetCalories * 0.3) / 4),
    carbs: Math.round((targetCalories * 0.4) / 4),
    fat: Math.round((targetCalories * 0.3) / 9),
    biometrics,
  };
}
