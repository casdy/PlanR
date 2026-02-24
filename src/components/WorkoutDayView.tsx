import { useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { ShieldAlert, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ExerciseImage } from './ExerciseImage';

const RECOVERY_EXERCISES = [
    { id: 'rec-1', name: 'Cat-Cow Mobility', targetSets: 2, targetReps: '10' },
    { id: 'rec-2', name: 'Thread the Needle', targetSets: 2, targetReps: '8/side' },
    { id: 'rec-3', name: 'Deep Squat Hold', targetSets: 2, targetReps: '60s' },
];

export const WorkoutDayView = ({ day }: { day: any }) => {
    const { activeIntensity, isRecoveryMode, scaleIntensity, swapToRecovery } = useWorkoutStore();

    const displayedDay = useMemo(() => {
        if (isRecoveryMode) {
            return {
                ...day,
                title: 'Active Recovery & Mobility',
                exercises: RECOVERY_EXERCISES
            };
        }

        const multiplier = activeIntensity === 'light' ? 0.8 : activeIntensity === 'intense' ? 1.2 : 1.0;

        return {
            ...day,
            exercises: day.exercises.map((ex: any) => {
                const baseReps = parseInt(ex.targetReps) || 10;
                const scaledReps = Math.round(baseReps * multiplier);
                
                return {
                    ...ex,
                    targetReps: String(ex.targetReps).includes('-') 
                        ? ex.targetReps 
                        : `${scaledReps} (Scaled)`
                };
            })
        };
    }, [day, activeIntensity, isRecoveryMode]);

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">Current Protocol</p>
                    <h2 className="text-3xl font-black tracking-tighter">{displayedDay.title}</h2>
                </div>
                {!isRecoveryMode && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => swapToRecovery()}
                        className="rounded-xl border-orange-500/20 text-orange-500 hover:bg-orange-500/10 flex gap-2"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        Swap to Recovery
                    </Button>
                )}
            </header>

            {!isRecoveryMode && (
                <Card className="bg-secondary/30 border-none rounded-[2rem]">
                    <CardContent className="p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Set Intensity Level</p>
                        <div className="flex gap-2">
                            {(['light', 'standard', 'intense'] as const).map((level) => (
                                <Button
                                    key={level}
                                    variant={activeIntensity === level ? 'primary' : 'ghost'}
                                    onClick={() => scaleIntensity(level)}
                                    className={cn(
                                        "flex-1 rounded-2xl capitalize font-bold",
                                        activeIntensity === level && "glow-primary"
                                    )}
                                >
                                    {level}
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
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="border-border/40 hover:border-primary/30 transition-all rounded-3xl overflow-hidden group">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-black shadow-lg">
                                            {i + 1}
                                        </div>
                                        <ExerciseImage exerciseName={exercise.name} className="w-16 h-16 flex-shrink-0" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{exercise.name}</h4>
                                        <div className="flex gap-3 text-xs font-black uppercase text-muted-foreground tracking-wider pt-1">
                                            <span>{exercise.targetSets} Sets</span>
                                            <span>{exercise.targetReps} Reps</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <h3 className="text-xl font-black">AI Adaptation Active</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                        Your routine was dynamically swapped to prioritize mobility and CNS recovery based on your session feedback.
                    </p>
                </div>
            )}
        </div>
    );
};
