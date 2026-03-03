import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { ExerciseLog, RecoveryLog } from '../engine/types';
import { detectDeloadTrigger } from '../engine/deloadEngine';

export function usePerformance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submit an individual exercise's performance to the engine history.
   */
  const logExercisePerformance = async (
    exerciseId: string,
    weight: number,
    reps: number,
    sets: number,
    rpe?: number | null
  ) => {
    if (!user || user.id === 'guest') return null;

    setLoading(true);
    setError(null);

    const log = {
      user_id: user.id,
      exercise_id: exerciseId,
      weight,
      reps,
      sets,
      rpe: rpe || null
    };

    try {
      const { data, error: sbError } = await supabase
        .from('exercise_logs')
        .insert([log])
        .select()
        .single();

      if (sbError) throw sbError;
      return data;
    } catch (err: any) {
      console.error('Failed to log exercise performance:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch user's performance history for the engine to base future adjustments off of.
   */
  const fetchPerformanceHistory = async (): Promise<ExerciseLog[]> => {
    if (!user || user.id === 'guest') return [];

    try {
      const { data, error: sbError } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('performed_at', { ascending: false });

      if (sbError) throw sbError;
      return data as ExerciseLog[];
    } catch (err: any) {
      console.error('Failed to fetch performance history:', err);
      setError(err.message);
      return [];
    }
  };

  /**
   * Phase 1.3: Checks if the engine recommends a deload based on recent performance/recovery.
   */
  const checkDeloadStatus = async () => {
    if (!user || user.id === 'guest') return { isDeloadRecommended: false, fatigueLevel: 'Low', reason: '' };

    try {
      setLoading(true);
      // Get rolling 7 days recovery
      const { data: recoveryData, error: recError } = await supabase
        .from('recovery_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(7);

      if (recError) throw recError;

      // Get recent 15 exercise logs (enough to spot a pattern)
      const { data: perfData, error: perfError } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('performed_at', { ascending: false })
        .limit(15);

      if (perfError) throw perfError;

      const trigger = detectDeloadTrigger(
        (perfData || []) as ExerciseLog[], 
        (recoveryData || []) as RecoveryLog[]
      );
      
      return trigger;
    } catch (err: any) {
      console.error('Failed to check deload status:', err);
      return { isDeloadRecommended: false, fatigueLevel: 'Low', reason: 'Error checking status' };
    } finally {
      setLoading(false);
    }
  };

  return { logExercisePerformance, fetchPerformanceHistory, checkDeloadStatus, loading, error };
}
