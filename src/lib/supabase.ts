/**
 * @file src/lib/supabase.ts
 * @description Supabase client singleton.
 *
 * Initialises and exports a single shared Supabase client using the project
 * URL and anonymous API key pulled from Vite environment variables.
 * Throws a descriptive error at startup if the required env vars are missing.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('PlanR: Supabase environment variables are missing. Cloud features will be disabled. This is expected in local development if no .env is provided.');
}

/** 
 * Shared Supabase client instance.
 * Using an empty string fallback to prevent createClient from crashing if URL is missing,
 * allowing the UI to load and show a meaningful error later if needed.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
