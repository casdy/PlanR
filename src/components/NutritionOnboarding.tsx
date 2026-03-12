import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Target, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ACTIVITY_MULTIPLIERS, LBS_TO_KG } from '../engine/calorieEngine';

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

interface OnboardingData {
  age: number;
  height_cm: number;
  weight_lbs: number;
  sex: 'male' | 'female';
  goal_weight_lbs: number;
  weekly_goal_rate: number;
  baseline_activity: number;
  primary_fitness_goal: string;
}

export const NutritionOnboarding: React.FC<{ isOpen: boolean; onComplete: () => void }> = ({ isOpen, onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    age: 25,
    height_cm: 175,
    weight_lbs: 155,
    sex: 'male',
    goal_weight_lbs: 155,
    weekly_goal_rate: -0.5,
    baseline_activity: ACTIVITY_MULTIPLIERS.sedentary,
    primary_fitness_goal: 'fat_loss',
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSave = async () => {
    if (!user?.id) return;
    
    if (!isUUID(user.id)) {
      console.debug('[onboarding] Skipping database sync for guest user.');
      onComplete();
      return;
    }

    setLoading(true);
    try {
      // 1. Save Biometrics (Internal DB uses KG)
      const { error: bioError } = await supabase.from('user_biometrics').upsert({
        user_id: user.id,
        age: data.age,
        height_cm: data.height_cm,
        weight_kg: parseFloat((data.weight_lbs * LBS_TO_KG).toFixed(2)),
        sex: data.sex,
        goal_weight_kg: parseFloat((data.goal_weight_lbs * LBS_TO_KG).toFixed(2)),
        weekly_goal_rate: data.weekly_goal_rate,
        primary_fitness_goal: data.primary_fitness_goal,
      }, { onConflict: 'user_id' });

      if (bioError) throw bioError;

      // 2. Save Initial Activity Log for today
      // This ensures the engine has a baseline for "yesterday" logic when today becomes tomorrow
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('daily_activity_logs').insert({
        user_id: user.id,
        date: today,
        activity_multiplier: data.baseline_activity,
        notes: 'Initial onboarding value',
      });

      onComplete();
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-teal-500/10 rounded-2xl">
                    <User className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Basic Info</h2>
                    <p className="text-zinc-500 dark:text-slate-400 text-sm">Let's get your baseline stats.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Age" 
                    type="number"
                    value={data.age}
                    onChange={e => setData({ ...data, age: parseInt(e.target.value) })}
                  />
                  <div className="space-y-1.5 flex flex-col items-start w-full">
                    <label className="text-sm font-semibold text-foreground/70 ml-1">Sex</label>
                    <div className="flex gap-2 w-full">
                      {(['male', 'female'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setData({ ...data, sex: s })}
                          className={`flex-1 py-3 rounded-xl border font-bold capitalize transition-all ${
                            data.sex === s 
                              ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' 
                              : 'bg-zinc-100 dark:bg-slate-800 border-zinc-200 dark:border-slate-700 text-zinc-500 dark:text-slate-400 hover:border-zinc-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Height (cm)" 
                    type="number"
                    value={data.height_cm}
                    onChange={e => setData({ ...data, height_cm: parseInt(e.target.value) })}
                  />
                  <Input 
                    label="Weight (lbs)" 
                    type="number"
                    step="0.1"
                    value={data.weight_lbs}
                    onChange={e => setData({ ...data, weight_lbs: parseFloat(e.target.value) })}
                  />
                </div>

                <Button className="w-full" onClick={nextStep}>
                  Next <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-teal-500/10 rounded-2xl">
                    <Target className="text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Your Goal</h2>
                    <p className="text-slate-400 text-sm">Where do you want to be?</p>
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col items-start w-full">
                  <label className="text-sm font-semibold text-foreground/70 ml-1">Primary Focus</label>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {([
                      { id: 'fat_loss', label: 'Fat Loss' },
                      { id: 'muscle_gain', label: 'Muscle Gain' },
                      { id: 'strength', label: 'Strength' },
                      { id: 'maintenance', label: 'Maintain' }
                    ]).map(g => (
                      <button
                        key={g.id}
                        onClick={() => {
                          const rates: any = { fat_loss: -0.7, muscle_gain: 0.3, strength: 0.1, maintenance: 0 };
                          setData({ ...data, primary_fitness_goal: g.id, weekly_goal_rate: rates[g.id] });
                        }}
                        className={`py-3 rounded-xl border font-bold capitalize transition-all ${
                          data.primary_fitness_goal === g.id 
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                            : 'bg-zinc-100 dark:bg-slate-800 border-zinc-200 dark:border-slate-700 text-zinc-500 dark:text-slate-400'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input 
                  label="Goal Weight (lbs)" 
                  type="number"
                  step="0.1"
                  value={data.goal_weight_lbs}
                  onChange={e => setData({ ...data, goal_weight_lbs: parseFloat(e.target.value) })}
                />

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-semibold text-foreground/70 ml-1">Weekly Pace</label>
                    <span className="text-teal-400 font-bold">
                      {data.weekly_goal_rate > 0 ? `+${data.weekly_goal_rate}` : data.weekly_goal_rate} lbs/week
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="-2" 
                    max="1" 
                    step="0.1"
                    value={data.weekly_goal_rate}
                    onChange={e => setData({ ...data, weekly_goal_rate: parseFloat(e.target.value) })}
                    className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <span>Lose 2lbs</span>
                    <span>Maintain</span>
                    <span>Gain 1lb</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="secondary" className="flex-1" onClick={prevStep}>
                    <ChevronLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button className="flex-[2]" onClick={nextStep}>
                    Next <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-teal-500/10 rounded-2xl">
                    <Activity className="text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Activity Level</h2>
                    <p className="text-slate-400 text-sm">How active are you usually?</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Sedentary', value: ACTIVITY_MULTIPLIERS.sedentary, desc: 'Office job, little exercise' },
                    { label: 'Lightly Active', value: ACTIVITY_MULTIPLIERS.lightly_active, desc: '1-3 days of exercise/week' },
                    { label: 'Moderately Active', value: ACTIVITY_MULTIPLIERS.moderately_active, desc: '3-5 days of exercise/week' },
                    { label: 'Very Active', value: ACTIVITY_MULTIPLIERS.very_active, desc: 'Heavy exercise 6-7 days/week' },
                  ].map(level => (
                    <button
                      key={level.label}
                      onClick={() => setData({ ...data, baseline_activity: level.value })}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${
                        data.baseline_activity === level.value 
                          ? 'bg-teal-500/10 border-teal-500 shadow-lg shadow-teal-500/10' 
                          : 'bg-zinc-50 dark:bg-slate-800 border-zinc-200 dark:border-slate-700 hover:border-zinc-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <p className={`font-bold ${data.baseline_activity === level.value ? 'text-teal-600 dark:text-teal-400' : 'text-slate-900 dark:text-white'}`}>
                        {level.label}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">{level.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button variant="secondary" className="flex-1" onClick={prevStep}>
                    <ChevronLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button className="flex-[2]" onClick={handleSave} isLoading={loading}>
                    Complete <Save className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
