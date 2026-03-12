import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, X, Check, Flame, Trophy, Dumbbell, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import type { FitnessGoal } from '../types';

interface GoalSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal?: FitnessGoal;
  userId: string;
  onSuccess: () => void;
}

const GOALS = [
  { 
    id: 'fat_loss' as FitnessGoal, 
    label: 'Fat Loss', 
    desc: 'Focus on calorie deficit and high-rep metabolic training.',
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    defaultRate: -0.7
  },
  { 
    id: 'muscle_gain' as FitnessGoal, 
    label: 'Muscle Gain', 
    desc: 'Push volume closer to MRV to maximize hypertrophy.',
    icon: Trophy,
    color: 'text-primary',
    bg: 'bg-primary/10',
    defaultRate: 0.3
  },
  { 
    id: 'strength' as FitnessGoal, 
    label: 'Strength', 
    desc: 'Optimize for intensity and neurological adaptation.',
    icon: Dumbbell,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    defaultRate: 0.1
  },
  { 
    id: 'maintenance' as FitnessGoal, 
    label: 'Maintenance', 
    desc: 'Maintain current body composition and recover.',
    icon: Zap,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    defaultRate: 0
  }
];

export const GoalSelectorModal: React.FC<GoalSelectorModalProps> = ({ 
  isOpen, 
  onClose, 
  currentGoal, 
  userId,
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FitnessGoal | undefined>(currentGoal);

  const handleSave = async () => {
    if (!selected || !userId) return;
    setLoading(true);
    
    const goalConfig = GOALS.find(g => g.id === selected);
    
    try {
      const { error } = await supabase
        .from('user_biometrics')
        .update({ 
          primary_fitness_goal: selected,
          weekly_goal_rate: goalConfig?.defaultRate || 0
        })
        .eq('user_id', userId);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update goal:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-t sm:border border-white/10"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Set Your Focus</h2>
                <p className="text-sm text-muted-foreground font-medium">Choose your primary fitness objective.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid gap-3">
            {GOALS.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelected(goal.id)}
                className={`flex items-center gap-4 p-4 rounded-3xl border transition-all text-left ${
                  selected === goal.id 
                    ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${goal.bg} ${goal.color}`}>
                  <goal.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${selected === goal.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                    {goal.label}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                    {goal.desc}
                  </p>
                </div>
                {selected === goal.id && (
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="secondary" className="flex-1 rounded-2xl h-14" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-[2] rounded-2xl h-14" 
              onClick={handleSave} 
              isLoading={loading}
              disabled={!selected || selected === currentGoal}
            >
              Update Goal
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
