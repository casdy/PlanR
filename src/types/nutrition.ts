export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id?: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at?: string;
  user_id?: string;
}

export interface DayStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logCount: number;
}
