export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
