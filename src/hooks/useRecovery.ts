import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { calculateRecoveryScore } from '../engine/recoveryEngine';
import type { RecoveryLog } from '../engine/types';

export function useRecovery() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRecoveryLog = async (
    sleep: number,
    soreness: number,
    stress: number,
    energy: number
  ) => {
    if (!user || user.id === 'guest') return null;
    
    setLoading(true);
    setError(null);

    const log = {
      user_id: user.id,
      sleep_score: sleep,
      soreness_score: soreness,
      stress_score: stress,
      energy_score: energy,
    };

    try {
      const { data, error: sbError } = await supabase
        .from('recovery_logs')
        .insert([log])
        .select()
        .single();

      if (sbError) throw sbError;
      
      const score = calculateRecoveryScore(log as Partial<RecoveryLog>);
      return { log: data, score };
    } catch (err: any) {
      console.error('Failed to submit recovery log:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentRecoveryLogs = async (limit = 7) => {
    if (!user || user.id === 'guest') return [];
    
    const { data, error: sbError } = await supabase
      .from('recovery_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (sbError) {
      console.error('Failed to fetch recovery logs:', sbError);
      return [];
    }

    return data as RecoveryLog[];
  };

  return { submitRecoveryLog, fetchRecentRecoveryLogs, loading, error };
}
