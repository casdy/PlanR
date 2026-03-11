import { useState } from 'react';

export const theme = {
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
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  roundness: {
    sm: 8,
    md: 12,
    lg: 20,
    full: 9999,
  }
};

export const useTheme = () => {
  // In a real app, this would detect dark/light mode toggle
  const [isDark, setIsDark] = useState(true);
  
  return {
    theme,
    isDark,
    toggleTheme: () => setIsDark(!isDark),
  };
};
