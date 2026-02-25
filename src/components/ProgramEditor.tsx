import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getExercisesByTarget } from '../services/exerciseDBService';
import type { ExerciseDBItem } from '../services/exerciseDBService';
import type { WorkoutProgram, Exercise } from '../types';
import { ProgramService } from '../services/programService';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { RefreshCw, Dumbbell, ShieldAlert, X, Loader2 } from 'lucide-react';

interface ProgramEditorProps {
    program: WorkoutProgram;
    onUpdate: (updatedProgram: WorkoutProgram) => void;
}

export const ProgramEditor = ({ program, onUpdate }: ProgramEditorProps) => {
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [loadingAlternatives, setLoadingAlternatives] = useState(false);
    const [alternatives, setAlternatives] = useState<ExerciseDBItem[]>([]);
    const [targetExercise, setTargetExercise] = useState<{ dayId: string; exIndex: number; exId: string; muscle: string } | null>(null);

    // Hardcode a default muscle map for our default exercises if we can't infer it.
    // In a real app, 'muscle' would be saved on the `Exercise` type natively.
    const guessTarget = (name: string): string => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('squat') || lowerName.includes('leg')) return 'quads';
        if (lowerName.includes('press') && lowerName.includes('bench')) return 'pectorals';
        if (lowerName.includes('press')) return 'delts';
        if (lowerName.includes('curl')) return 'biceps';
        if (lowerName.includes('row') || lowerName.includes('pull')) return 'lats';
        if (lowerName.includes('pushup')) return 'pectorals';
        if (lowerName.includes('plank')) return 'abs';
        if (lowerName.includes('extension') && lowerName.includes('tricep')) return 'triceps';
        return 'pectorals'; // Fallback so the API still works
    };

    const handleOpenSwap = async (dayId: string, exIndex: number, currentExercise: Exercise) => {
        const target = guessTarget(currentExercise.name);
        setTargetExercise({ dayId, exIndex, exId: currentExercise.id, muscle: target });
        setSwapModalOpen(true);
        setLoadingAlternatives(true);

        try {
            const results = await getExercisesByTarget(target);
            // Filter out the exact same exercise, grab 3
            const filtered = results.filter(e => e.name.toLowerCase() !== currentExercise.name.toLowerCase()).slice(0, 3);
            setAlternatives(filtered);
        } catch (error) {
            console.error("Failed to fetch alternatives", error);
        } finally {
            setLoadingAlternatives(false);
        }
    };

    const handleConfirmSwap = async (newApiEx: ExerciseDBItem) => {
        if (!targetExercise) return;

        // Clone deeply
        const updatedProgram = JSON.parse(JSON.stringify(program)) as WorkoutProgram;
        
        const dayIndex = updatedProgram.schedule.findIndex(d => d.id === targetExercise.dayId);
        if (dayIndex > -1) {
            updatedProgram.schedule[dayIndex].exercises[targetExercise.exIndex] = {
                id: crypto.randomUUID(),
                name: newApiEx.name,
                targetSets: 3, // Keep defaults or try to inherit from previous
                targetReps: '10-12',
                notes: newApiEx.instructions ? newApiEx.instructions.join(' ').substring(0, 100) + '...' : '' // Sneak in some help
            };
        }

        updatedProgram.version += 1;
        await ProgramService.saveProgram(updatedProgram);
        onUpdate(updatedProgram);
        setSwapModalOpen(false);
    };

    return (
        <div className="space-y-8">
            {program.schedule.map((day) => (
                <div key={day.id} className="space-y-4">
                    <div className="border-b border-white/10 pb-2">
                        <h3 className="text-xl font-black">{day.title}</h3>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{day.dayOfWeek}</p>
                    </div>

                    {day.type === 'rest' || day.type === 'active_recovery' ? (
                        <div className="p-4 bg-secondary/30 rounded-2xl flex items-center gap-3 text-muted-foreground border border-dashed border-border/50">
                            <ShieldAlert className="w-5 h-5" />
                            <span className="font-bold text-sm">Rest day / Recovery. No active exercises.</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {day.exercises.map((ex, idx) => (
                                <Card key={ex.id} className="glass rounded-2xl flex items-center justify-between p-3 border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{ex.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{ex.targetSets} Sets • {ex.targetReps}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 text-xs gap-1 rounded-xl"
                                        onClick={() => handleOpenSwap(day.id, idx, ex)}
                                    >
                                        <RefreshCw className="w-3 h-3" /> Swap
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {/* Swap Modal */}
            <AnimatePresence>
                {swapModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ y: 100, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 100, scale: 0.95 }}
                            className="w-full max-w-md bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card z-10">
                                <div>
                                    <h3 className="text-xl font-black">Swap Exercise</h3>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                                        Target: {targetExercise?.muscle}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50" onClick={() => setSwapModalOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-3">
                                {loadingAlternatives ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        <p className="text-sm text-muted-foreground font-medium animate-pulse">Finding alternatives via ExerciseDB...</p>
                                    </div>
                                ) : (
                                    <>
                                        {alternatives.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">No alternatives found for this muscle group.</div>
                                        ) : (
                                            alternatives.map((alt, i) => (
                                                <Card key={i} className="rounded-2xl border-white/10 dark:border-white/5 bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer overflow-hidden p-0" onClick={() => handleConfirmSwap(alt)}>
                                                    <div className="flex gap-4 items-center">
                                                        <div className="w-24 h-24 bg-white/5 flex items-center justify-center shrink-0">
                                                                {alt.gifUrl ? (
                                                                    <img 
                                                                        src={alt.gifUrl} 
                                                                        alt={alt.name} 
                                                                        className="w-full h-full object-cover mix-blend-multiply" 
                                                                        loading="lazy" 
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            (e.currentTarget.parentElement?.querySelector('.fallback-icon') as HTMLElement).style.display = 'block';
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <Dumbbell className="w-8 h-8 text-primary fallback-icon" style={{ display: alt.gifUrl ? 'none' : 'block' }} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 py-3 pr-4">
                                                            <p className="font-bold text-sm truncate">{alt.name}</p>
                                                            <div className="flex gap-2 text-[10px] uppercase font-black text-muted-foreground mt-1">
                                                                <span className="bg-background px-2 py-0.5 rounded-full">{alt.target}</span>
                                                                <span className="bg-background px-2 py-0.5 rounded-full truncate">{alt.equipment.replace('_', ' ')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
