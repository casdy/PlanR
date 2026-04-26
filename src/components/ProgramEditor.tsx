/**
 * @file src/components/ProgramEditor.tsx
 * @description Inline exercise swap editor for saved workout programs.
 *
 * Renders a list of all exercises in the program's schedule with a "Swap" button
 * on each. Clicking Swap opens a modal powered by ExerciseDB that shows
 * 3 alternative exercises for the same muscle group. Confirming a swap updates
 * the program in LocalService and calls `onUpdate` to re-render the parent.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getExercisesByMuscle } from '../services/exerciseService';
import type { DbExercise } from '../services/exerciseService';
import type { WorkoutProgram, WorkoutEntry } from '../types';
import { ProgramService } from '../services/programService';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { RefreshCw, ShieldAlert, X, Loader2 } from 'lucide-react';
import { ExerciseImage } from './ExerciseImage';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

interface ProgramEditorProps {
    program: WorkoutProgram;
    onUpdate: (updatedProgram: WorkoutProgram) => void;
}

export const ProgramEditor = ({ program, onUpdate }: ProgramEditorProps) => {
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [loadingAlternatives, setLoadingAlternatives] = useState(false);
    const [alternatives, setAlternatives] = useState<DbExercise[]>([]);
    const [targetExercise, setTargetExercise] = useState<{ dayId: string; slotId: string; entryId: string; muscle: string } | null>(null);
    const { t } = useLanguage();

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

    const handleOpenSwap = async (dayId: string, slotId: string, entry: WorkoutEntry) => {
        const target = guessTarget(entry.name);
        setTargetExercise({ dayId, slotId, entryId: entry.id, muscle: target });
        setSwapModalOpen(true);
        setLoadingAlternatives(true);

        try {
            const results = await getExercisesByMuscle(target);
            // Filter out the exact same exercise, grab 3
            const filtered = results.filter(e => e.name.toLowerCase() !== entry.name.toLowerCase()).slice(0, 3);
            setAlternatives(filtered);
        } catch (error) {
            console.error("Failed to fetch alternatives", error);
        } finally {
            setLoadingAlternatives(false);
        }
    };

    const handleConfirmSwap = async (newApiEx: DbExercise) => {
        if (!targetExercise) return;

        // Clone deeply
        const updatedProgram = JSON.parse(JSON.stringify(program)) as WorkoutProgram;
        
        const dayIdx = updatedProgram.schedule.findIndex(d => d.id === targetExercise.dayId);
        if (dayIdx > -1) {
            const slotIdx = updatedProgram.schedule[dayIdx].slots.findIndex(s => s.id === targetExercise.slotId);
            if (slotIdx > -1) {
                const entryIdx = updatedProgram.schedule[dayIdx].slots[slotIdx].entries.findIndex(e => e.id === targetExercise.entryId);
                if (entryIdx > -1) {
                    updatedProgram.schedule[dayIdx].slots[slotIdx].entries[entryIdx] = {
                        id: crypto.randomUUID(),
                        exerciseId: crypto.randomUUID(),
                        name: newApiEx.name,
                        targetSets: 3,
                        targetReps: '10-12',
                        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
                        notes: newApiEx.instructions ? newApiEx.instructions.join(' ').substring(0, 100) + '...' : ''
                    };
                }
            }
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
                            <span className="font-bold text-sm">{t('rest_day_no_exercises')}</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {day.slots.map((slot, sIdx) => (
                                <div key={slot.id} className={cn(
                                    "space-y-2 rounded-2xl",
                                    slot.type !== 'normal' && "p-3 bg-amber-500/5 border border-amber-500/10"
                                )}>
                                    {slot.type !== 'normal' && (
                                        <p className="text-[10px] font-black uppercase text-amber-500 px-1 mb-2">{slot.type}</p>
                                    )}
                                    {slot.entries.map((ex, eIdx) => (
                                        <Card key={ex.id} className="glass rounded-2xl flex items-center justify-between p-3 border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                    {sIdx + 1}{slot.entries.length > 1 ? String.fromCharCode(97 + eIdx) : ''}
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
                                                onClick={() => handleOpenSwap(day.id, slot.id, ex)}
                                            >
                                                <RefreshCw className="w-3 h-3" /> {t('swap_exercise')}
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
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
                                    <h3 className="text-xl font-black">{t('swap_exercise')}</h3>
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
                                        <p className="text-sm text-muted-foreground font-medium animate-pulse">{t('finding_alternatives')}</p>
                                    </div>
                                ) : (
                                    <>
                                        {alternatives.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">{t('no_alternatives_found')}</div>
                                        ) : (
                                            alternatives.map((alt, i) => (
                                                <Card key={i} className="rounded-2xl border-white/10 dark:border-white/5 bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer overflow-hidden p-0" onClick={() => handleConfirmSwap(alt)}>
                                                    <div className="flex gap-4 items-center">
                                                        <div className="w-24 h-24 bg-white dark:bg-zinc-200 flex items-center justify-center shrink-0 p-2 border border-border/50 shadow-inner overflow-hidden">
                                                            <ExerciseImage exerciseName={alt.name} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 py-3 pr-4">
                                                            <p className="font-bold text-sm truncate">{alt.name}</p>
                                                            <div className="flex gap-2 text-[10px] uppercase font-black text-muted-foreground mt-1">
                                                                <span className="bg-background px-2 py-0.5 rounded-full">{alt.target || targetExercise?.muscle}</span>
                                                                <span className="bg-background px-2 py-0.5 rounded-full truncate">{(alt.equipment || 'bodyweight').replace('_', ' ')}</span>
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
