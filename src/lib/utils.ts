/**
 * @file src/lib/utils.ts
 * @description Shared utility functions used throughout the application.
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names together, resolving Tailwind CSS conflicts.
 * Uses `clsx` for conditional class logic and `tailwind-merge` to ensure
 * conflicting utilities (e.g. `px-2` and `px-4`) are deduplicated correctly.
 *
 * @example
 *   cn('text-sm', isActive && 'text-primary', 'font-bold')
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
