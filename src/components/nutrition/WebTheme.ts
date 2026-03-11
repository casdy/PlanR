export const nutritionTheme = {
  colors: {
    background: '#09090b',
    surface: '#18181b',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    primary: '#14b8a6', // Teal
    accent: '#10b981', // Emerald
    border: '#27272a',
    
    // Macro specific colors
    protein: '#3b82f6', // Blue
    carbs: '#f59e0b',   // Amber
    fat: '#ef4444',     // Red
    calories: '#14b8a6', // Teal
  },
};

export const useNutritionTheme = () => {
  return {
    theme: nutritionTheme,
  };
};
