/**
 * @file src/components/WorkoutDayView.tsx
 * @description Read-only view of a single day's exercise list within a program.
 *
 * Used in ProgramDetail to show the full exercise list for a selected day.
 * Tapping "Start Workout" calls `workoutStore.startWorkout` for that program/day.
 */
import { useState, useEffect, useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { ShieldAlert, Sparkles, Wand2, Info, ChevronRight, Zap, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { ExerciseImage } from './ExerciseImage';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabase';

const RECOVERY_EXERCISES = [
    { id: 'rec-1', name: 'Cat-Cow Mobility', targetSets: 2, targetReps: '10' },
    { id: 'rec-2', name: 'Thread the Needle', targetSets: 2, targetReps: '8/side' },
    { id: 'rec-3', name: 'Deep Squat Hold', targetSets: 2, targetReps: '60s' },
];

export const WorkoutDayView = ({ day, programTitle }: { day: any; programTitle?: string }) => {
    const { activeIntensity, isRecoveryMode, scaleIntensity, swapToRecovery } = useWorkoutStore();
    const { t } = useLanguage();
    const [exerciseMetadata, setExerciseMetadata] = useState<Record<string, string>>({});

    // Fetch metadata for exercises in this day
    useEffect(() => {
        if (!day?.exercises) return;

        const fetchMeta = async () => {
            const names = day.exercises.map((ex: any) => ex.name);
            const { data, error } = await supabase
                .from('exercises')
                .select('name, body_part')
                .in('name', names);

            if (!error && data) {
                const meta: Record<string, string> = {};
                data.forEach(item => {
                    meta[item.name.toLowerCase()] = item.body_part;
                });
                setExerciseMetadata(meta);
            }
        };

        fetchMeta();
    }, [day.exercises]);

    const displayedDay = useMemo(() => {
        if (isRecoveryMode) {
            return {
                ...day,
                title: 'Active Recovery & Mobility',
                exercises: RECOVERY_EXERCISES
            };
        }

        let exercises = [...day.exercises];
        const intensity = activeIntensity;

        if (intensity === 'light') {
            // Drop the last exercise if there's more than 3 (skip accessory)
            if (exercises.length > 3) {
                exercises.pop();
            }
        }

        return {
            ...day,
            exercises: exercises.map((ex: any) => {
                let baseSets = parseInt(String(ex.targetSets)) || 3;
                let baseReps = String(ex.targetReps);
                
                // Parse out the primary rep number if it's a range (e.g. "10-12" -> 10)
                let numReps = 10;
                const match = baseReps.match(/\d+/);
                if (match) {
                    numReps = parseInt(match[0]);
                }

                if (intensity === 'light') {
                    baseSets = Math.max(1, baseSets - 1);
                    numReps = Math.max(1, Math.round(numReps * 0.8));
                } else if (intensity === 'intense') {
                    baseSets += 1;
                    numReps = Math.round(numReps * 1.2);
                }

                return {
                    ...ex,
                    targetSets: baseSets,
                    primaryMuscle: exerciseMetadata[ex.name.toLowerCase()] || 'Target Group',
                    // If the original was a string format we couldn't parse cleanly, fall back to showing the math 
                    targetReps: intensity === 'standard' ? baseReps : `${numReps} (Scaled)`
                };
            })
        };
    }, [day, activeIntensity, isRecoveryMode, exerciseMetadata]);

    return (
        <div className="space-y-8">
            <header className="relative py-6 px-1">
                <div className="flex items-center justify-between mb-2">
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <Zap className="w-3 h-3 text-primary animate-pulse" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t('current_protocol')}</p>
                    </motion.div>
                    
                    {!isRecoveryMode && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => swapToRecovery()}
                            className="h-8 rounded-full border-orange-500/20 text-orange-500 hover:bg-orange-500/10 text-[10px] font-black uppercase tracking-tight"
                        >
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            {t('swap_to_recovery')}
                        </Button>
                    )}
                </div>

                <h2 className="text-4xl font-black tracking-tighter leading-none mb-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-zinc-200 dark:to-white bg-clip-text text-transparent">
                    {programTitle || displayedDay.title}
                </h2>

                <div className="flex flex-wrap gap-2 mt-4">
                    <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                        <Trophy className="w-3 h-3 text-primary" />
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                            {displayedDay.type || 'Strength'} Protocol
                        </span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center gap-2">
                        <Info className="w-3 h-3 text-zinc-500" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                            {displayedDay.durationMin || 45} MIN · {activeIntensity} LOAD
                        </span>
                    </div>
                </div>
            </header>

            {!isRecoveryMode && (
                <Card className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-[2.5rem] shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500 dark:text-zinc-400">{t('set_intensity_level')}</p>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black uppercase tracking-tighter">Adaptive Scaling</span>
                        </div>
                        <div className="flex gap-2 p-1 bg-zinc-100/50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-white/5">
                            {(['light', 'standard', 'intense'] as const).map((level) => (
                                <Button
                                    key={level}
                                    variant={activeIntensity === level ? 'primary' : 'ghost'}
                                    onClick={() => scaleIntensity(level)}
                                    className={cn(
                                        "flex-1 h-10 rounded-xl capitalize font-bold text-xs transition-all",
                                        activeIntensity === level ? "shadow-lg shadow-primary/20 scale-[1.02]" : "text-muted-foreground opacity-60 hover:opacity-100"
                                    )}
                                >
                                    {t(level as any)}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {displayedDay.exercises.map((exercise: any, i: number) => (
                    <motion.div
                        key={exercise.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <Card className="border-zinc-200 dark:border-white/5 hover:border-primary/50 transition-all rounded-[2rem] overflow-hidden group bg-white dark:bg-zinc-900/50 shadow-sm hover:shadow-xl dark:shadow-none">
                            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-5">
                                    <div className="relative shrink-0">
                                        <div className="absolute -top-1 -left-1 z-10 w-5 h-5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[9px] font-black shadow-xl">
                                            {i + 1}
                                        </div>
                                        <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-2 overflow-hidden shadow-inner flex items-center justify-center">
                                            <ExerciseImage exerciseName={exercise.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal opacity-80 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black text-lg sm:text-xl tracking-tight leading-none group-hover:text-primary transition-colors truncate">{exercise.name}</h4>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <Zap className="w-3 h-3 text-zinc-400" />
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{exercise.targetSets} Sets</span>
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                            <div className="flex items-center gap-1.5">
                                                <ChevronRight className="w-3 h-3 text-zinc-400" />
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{exercise.targetReps} Reps</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="px-2 py-0.5 rounded-[6px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase tracking-tighter border border-zinc-200 dark:border-white/5">
                                                Primary: {exercise.primaryMuscle || 'Target Group'}
                                            </span>
                                            {activeIntensity !== 'standard' && (
                                                <span className="px-2 py-0.5 rounded-[6px] bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[9px] font-black uppercase tracking-tighter border border-teal-500/20">
                                                    Smart Adjustment
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 hidden sm:block">
                                    <Sparkles className="w-5 h-5 text-primary/40" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {isRecoveryMode && (
                <div className="p-8 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10 text-center space-y-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto text-blue-500">
                        <Wand2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black">{t('ai_adaptation_active')}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                        {t('ai_adaptation_desc')}
                    </p>
                </div>
            )}
        </div>
    );
};
