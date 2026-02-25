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
  throw new Error('Missing Supabase environment variables! Check your .env.local file.');
}

/** Shared Supabase client — import this anywhere database access is needed. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
