import { useTheme } from '../../hooks/useTheme';

export const nutritionColors = {
  dark: {
    background: '#09090b', // zinc-950
    surface: '#18181b',    // zinc-900
    text: '#ffffff',
    textSecondary: '#a1a1aa', // zinc-400
    border: '#27272a',     // zinc-800
    primary: '#14b8a6',    // teal-500
    accent: '#10b981',     // emerald-500
  },
  light: {
    background: '#ffffff',
    surface: '#f4f4f5',    // zinc-100
    text: '#09090b',       // zinc-950
    textSecondary: '#71717a', // zinc-500
    border: '#e4e4e7',     // zinc-200
    primary: '#0d9488',    // teal-600
    accent: '#059669',     // emerald-600
  }
};

export const useNutritionTheme = () => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? nutritionColors.dark : nutritionColors.light;
  
  return {
    theme: {
      colors: {
        ...colors,
        // Macro specific colors (keep consistent or slightly adjust for light mode if needed)
        protein: '#3b82f6',
        carbs: '#f59e0b',
        fat: '#ef4444',
        calories: colors.primary,
      }
    },
    isDark: theme === 'dark'
  };
};
