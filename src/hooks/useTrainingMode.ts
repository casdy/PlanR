import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { TrainingMode } from '../engine/types';

export function useTrainingMode() {
  const { user } = useAuth();
  const [trainingMode, setTrainingMode] = useState<TrainingMode>('casual');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMode() {
      if (!user || user.id === 'guest') {
        setLoading(false);
        return;
      }
      try {
        const { data, error: sbError } = await supabase
          .from('users')
          .select('training_mode')
          .eq('id', user.id)
          .maybeSingle();

        if (sbError) {
          // If profile doesn't exist yet, it will fail gracefully or we can ignore
          console.error('Error fetching training mode:', sbError);
          setError(sbError.message);
        } else if (data && data.training_mode) {
          setTrainingMode(data.training_mode as TrainingMode);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMode();
  }, [user]);

  const updateTrainingMode = async (mode: TrainingMode) => {
    if (!user || user.id === 'guest') return;
    
    setTrainingMode(mode);
    const { error: sbError } = await supabase
      .from('users')
      .update({ training_mode: mode })
      .eq('id', user.id);

    if (sbError) {
      console.error('Failed to update training mode:', sbError);
      setError(sbError.message);
    }
  };

  return { trainingMode, loading, error, updateTrainingMode };
}
