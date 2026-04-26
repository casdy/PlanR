/**
 * @file src/services/exerciseService.ts
 * @description Master service for exercise metadata and media.
 * 
 * Communicates directly with the 
 * Supabase 'exercises' table which contains pre-migrated ExerciseDB 
 * data and locally hosted GIF assets.
 */
import { supabase } from '../lib/supabase';

export interface DbExercise {
  id: string;
  name: string;
  body_part: string;
  equipment?: string;
  target?: string;
  gif_url?: string;
  image_url?: string;
  instructions?: string[];
  description?: string;
}

/**
 * Fetch a single exercise by its name from Supabase.
 */
export async function getExerciseByName(name: string): Promise<DbExercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', name)
    .maybeSingle();

  if (error || !data) return null;
  return data as DbExercise;
}

/**
 * Get the media URL for an exercise.
 * Local GIFs are served via the Vite proxy at /api/exercise-gifs/
 */
/**
 * Get the media URL for an exercise.
 * Always routes through our Vite proxy at /api/exercise-gifs/ to satisfy 
 * strict COEP/CORP security headers required for the SQLite WASM engine.
 */
export function getExerciseImageUrl(exercise: DbExercise): string {
  const rawUrl = exercise.gif_url || exercise.image_url;
  if (!rawUrl) return '';
  
  // If it's an external non-Supabase image, we might still have CORS issues
  // but we try to load it directly. 
  if (rawUrl.startsWith('http') && !rawUrl.includes('supabase.co/storage')) {
    return rawUrl;
  }
  
  // For local files or Supabase storage files, extract filename and use proxy
  const filename = rawUrl.split('/').pop() || '';
  return `/api/exercise-gifs/${filename}`;
}

/**
 * Fetch exercises by body part from Supabase.
 */
export async function getExercisesByBodyPart(bodyPart: string): Promise<DbExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('body_part', bodyPart);

  if (error || !data) return [];
  return data as DbExercise[];
}

/**
 * Fetch exercises by targeted muscle (target) from Supabase.
 */
export async function getExercisesByMuscle(muscle: string): Promise<DbExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('target', muscle);

  if (error || !data) return [];
  return data as DbExercise[];
}

/**
 * Fetch bodyweight exercises from Supabase for deload/recovery.
 */
export async function getBodyweightExercises(limit = 10): Promise<DbExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('equipment', 'bodyweight')
    .limit(limit);

  if (error || !data) return [];
  return data as DbExercise[];
}
