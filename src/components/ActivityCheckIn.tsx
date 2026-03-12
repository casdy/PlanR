import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Check } from 'lucide-react';
import { ACTIVITY_MULTIPLIERS } from '../engine/calorieEngine';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface ActivityCheckInProps {
  onLogged: () => void;
}

export const ActivityCheckIn: React.FC<ActivityCheckInProps> = ({ onLogged }) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const levels = [
    { label: 'Sedentary', value: ACTIVITY_MULTIPLIERS.sedentary },
    { label: 'Light', value: ACTIVITY_MULTIPLIERS.lightly_active },
    { label: 'Moderate', value: ACTIVITY_MULTIPLIERS.moderately_active },
    { label: 'Active', value: ACTIVITY_MULTIPLIERS.very_active },
  ];

  // Check if already logged for yesterday
  useEffect(() => {
    async function checkExisting() {
      if (!user?.id) return;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data } = await supabase
        .from('daily_activity_logs')
        .select('activity_multiplier')
        .eq('user_id', user.id)
        .eq('date', yesterdayStr)
        .maybeSingle();

      if (data) {
        setSelected(data.activity_multiplier);
      }
    }
    checkExisting();
  }, [user?.id]);

  const handleSelect = async (multiplier: number) => {
    if (!user?.id || saving) return;
    setSaving(true);
    
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { error } = await supabase.from('daily_activity_logs').upsert({
        user_id: user.id,
        date: yesterdayStr,
        activity_multiplier: multiplier,
      }, { onConflict: 'user_id,date' });

      if (error) throw error;
      
      setSelected(multiplier);
      onLogged();
    } catch (err) {
      console.error('Failed to log activity:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-[2rem] bg-zinc-50 dark:bg-slate-800/40 border border-zinc-200 dark:border-slate-700/50 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-500/10 rounded-xl">
          <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">How active were you yesterday?</h3>
          <p className="text-[10px] text-zinc-500 dark:text-slate-500 uppercase tracking-widest font-bold">Daily Check-In</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {levels.map((level) => (
          <button
            key={level.label}
            onClick={() => handleSelect(level.value)}
            disabled={saving}
            className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl border text-[11px] font-bold transition-all ${
              selected === level.value
                ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20'
                : 'bg-zinc-100 dark:bg-slate-800/60 border-zinc-200 dark:border-slate-700 text-zinc-500 dark:text-slate-400 hover:border-zinc-300 dark:hover:border-slate-600'
            }`}
          >
             <div className="flex items-center justify-center gap-1">
               {selected === level.value && <Check className="w-3 h-3" />}
               {level.label}
             </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};
