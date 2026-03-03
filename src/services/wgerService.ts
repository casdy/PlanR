/**
 * @file src/services/wgerService.ts
 * @description Exercise library access via Supabase.
 *
 * Replaces all direct ExerciseDB / RapidAPI calls.
 * All functions query the `exercises` table that was seeded from
 * cleaned_exercises.json (1 583 rows from wger + ExerciseDB).
 */

import { supabase } from '../lib/supabase';

// ── Type ─────────────────────────────────────────────────────────────────────

/** A single exercise row from the Supabase `exercises` table. */
export interface DbExercise {
  id: string;
  id_wger: string;
  id_exercisedb: string;
  name: string;
  description: string;
  category: string;
  muscles: string[];
  images: string[];
  body_part: string;
  target: string;
  gif_url: string;
  instructions: string[];
  secondary_muscles: string[];
  equipment: string;
  source: 'wger' | 'exercisedb' | string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the best available image URL for an exercise, proxied for COEP headers */
export function getExerciseImageUrl(ex: DbExercise): string {
  let rawUrl = '';
  if (ex.images && ex.images.length > 0) {
    rawUrl = ex.images[0];
  } else if (ex.gif_url) {
    rawUrl = ex.gif_url;
  }
  
  if (!rawUrl) return '';

  // Handle Wger exercises (both relative and absolute)
  if (rawUrl.includes('wger.de') || rawUrl.startsWith('/media/')) {
    const imagePath = rawUrl.replace(/^https?:\/\/wger\.de/, '');
    // Ensure it starts with a slash
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `/api/wger-media${normalizedPath}`;
  }

  // Proxy Exercisedb URLs to inject Cross-Origin-Resource-Policy headers
  return `/api/cdn-proxy?url=${encodeURIComponent(rawUrl)}`;
}

// ── Query functions ───────────────────────────────────────────────────────────

/**
 * Find exercises that target a specific muscle.
 * Uses Supabase's `cs` (array contains) filter.
 * muscle = any value stored in the muscles[] column, e.g. "Chest", "Biceps"
 */
export async function getExercisesByMuscle(
  muscle: string,
  limit = 10
): Promise<DbExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .contains('muscles', [muscle])
    .limit(limit);

  if (error) {
    console.error('[wgerService] getExercisesByMuscle error:', error.message);
    return [];
  }
  return (data as DbExercise[]) ?? [];
}

/**
 * Find exercises by wger category (e.g. "Chest", "Legs", "Arms", "Back", "Abs").
 */
export async function getExercisesByCategory(
  category: string,
  limit = 10
): Promise<DbExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('category', category)
    .limit(limit);

  if (error) {
    console.error('[wgerService] getExercisesByCategory error:', error.message);
    return [];
  }
  return (data as DbExercise[]) ?? [];
}

/**
 * Find exercises by ExerciseDB body part (e.g. "chest", "back", "upper legs").
 */
export async function getExercisesByBodyPart(
  bodyPart: string,
  limit = 10
): Promise<DbExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('body_part', bodyPart)
    .limit(limit);

  if (error) {
    console.error('[wgerService] getExercisesByBodyPart error:', error.message);
    return [];
  }
  return (data as DbExercise[]) ?? [];
}

/**
 * Full-text name search.
 */
export async function searchExercises(
  query: string,
  limit = 20
): Promise<DbExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(limit);

  if (error) {
    console.error('[wgerService] searchExercises error:', error.message);
    return [];
  }
  return (data as DbExercise[]) ?? [];
}

/**
 * Fetch bodyweight / low-equipment exercises for deload / mobility routines.
 * Matches any equipment value that contains "body" or "none".
 */
export async function getBodyweightExercises(limit = 8): Promise<DbExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .or('equipment.ilike.%body%,equipment.ilike.%none%')
    .limit(limit);

  if (error) {
    console.error('[wgerService] getBodyweightExercises error:', error.message);
    return [];
  }
  return (data as DbExercise[]) ?? [];
}

/**
 * Fetch a random selection of exercises for a quick casual-mode workout.
 * Randomness is achieved by fetching a larger pool and shuffling client-side.
 */
export async function getRandomExercises(count = 6): Promise<DbExercise[]> {
  // Fetch a representative pool from multiple categories, shuffle, return `count`
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .not('name', 'is', null)
    .limit(100);

  if (error) {
    console.error('[wgerService] getRandomExercises error:', error.message);
    return [];
  }

  const pool = (data as DbExercise[]) ?? [];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// ── Live API Fetching (Phase 4) ───────────────────────────────────────────────

/**
 * Fetches authoritative Wger media directly from the API by searching the exercise name.
 * We use our secure `/api/wger/v2/exercise/search/` proxy to inject the Auth key.
 */
export async function fetchWgerMedia(exerciseName: string): Promise<string> {
  try {
    const res = await fetch(`/api/wger/v2/exercise/search/?term=${encodeURIComponent(exerciseName)}`);
    if (!res.ok) return '';
    
    const data = await res.json();
    if (data.suggestions && data.suggestions.length > 0) {
      // Prioritize exact match, fallback to first suggestion
      const match = data.suggestions.find((s: any) => s.data.name.toLowerCase() === exerciseName.toLowerCase()) || data.suggestions[0];
      
      if (match && match.data.image) {
        // match.data.image is usually a relative path like "/media/exercise-images/..."
        const imagePath = match.data.image.replace(/^https?:\/\/wger\.de/, '');
        
        // Pass it through our dedicated wger-media proxy to inject COEP headers
        // The Vite proxy rewrites ^/api/wger-media/ to '', so
        // /api/wger-media/media/exercise-images/... -> /media/exercise-images/... on wger.de
        return `/api/wger-media${imagePath}`;
      }
    }
  } catch (err) {
    console.error('[wgerService] Failed to fetch live wger media:', err);
  }
  return '';
}
