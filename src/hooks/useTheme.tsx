/**
 * @file src/hooks/useTheme.tsx
 * @description Provides light/dark theme management with localStorage persistence.
 *
 * Reads the initial theme from `localStorage` (or the OS preference via
 * `prefers-color-scheme`) and applies the `light` or `dark` class to the
 * `<html>` element whenever the theme changes.
 *
 * Usage:
 *   const { theme, toggleTheme } = useTheme();
 */
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

/**
 * Custom hook that manages the application's active colour theme.
 * Returns `{ theme, toggleTheme }` — call `toggleTheme()` to switch modes.
 */
export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Prefer the user's previously saved choice, fall back to OS preference
        const stored = localStorage.getItem('planr-theme');
        if (stored === 'light' || stored === 'dark') return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        // Sync the <html> class list and persist the preference
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('planr-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return { theme, toggleTheme };
};
