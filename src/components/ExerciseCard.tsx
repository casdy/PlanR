/**
 * @file src/components/ExerciseCard.tsx
 * @description Card UI for displaying a single exercise suggestion on the Dashboard.
 *
 * Shows the exercise name, category, equipment, and a demo GIF from Supabase Storage.
 * Tapping the card expands a detail panel with step-by-step instructions.
 * All data is sourced from the Supabase `exercises` table — no external API calls.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell } from 'lucide-react';
import { Button } from './ui/Button';
import { createPortal } from 'react-dom';
import type { DbExercise } from '../services/exerciseService';
import { getExerciseImageUrl } from '../services/exerciseService';
import { useLanguage } from '../hooks/useLanguage';

interface ExerciseCardProps {
    exercise: DbExercise;
}

export const ExerciseCard = ({ exercise }: ExerciseCardProps) => {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const mediaUrl = getExerciseImageUrl(exercise);

    return (
        <>
            {/* Compact card shown in the horizontal scroll strip */}
            <div
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsModalOpen(true);
                }}
                className="flex-shrink-0 min-w-[140px] max-w-[160px] bg-white/5 dark:bg-zinc-900/40 p-4 rounded-2xl border border-white/10 dark:border-white/5 cursor-pointer hover:bg-white/10 dark:hover:bg-zinc-900/60 transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsModalOpen(true);
                    }
                }}
            >
                {/* Thumbnail image or fallback dumbbell */}
                <div className="w-full aspect-square bg-white dark:bg-zinc-200 rounded-xl mb-3 flex items-center justify-center p-2 border border-border/50 shadow-inner overflow-hidden">
                    {mediaUrl && !imageError ? (
                        <img
                            src={mediaUrl}
                            alt={exercise.name}
                            className="w-full h-full object-contain drop-shadow-sm rounded-lg"
                            onError={() => setImageError(true)}
                            loading="lazy"
                        />
                    ) : (
                        <Dumbbell className="w-7 h-7 text-zinc-400" />
                    )}
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 truncate">
                    {exercise.target || t('exercise_fallback')}
                </p>
                <p className="text-sm font-bold truncate leading-tight mb-2">{exercise.name}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60">
                    <span className="bg-white/5 px-2 py-0.5 rounded-full capitalize">
                        {(exercise.equipment || 'bodyweight').replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            {/* Expanded Guidance UI Modal (GIF) uses Portal to avoid clipping */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsModalOpen(false);
                            }}
                        >
                        <motion.div 
                            initial={{ y: 100, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 100, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-lg bg-card border border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/5 flex items-start justify-between bg-card z-10 sticky top-0">
                                <div className="pr-4">
                                    <h3 className="text-2xl font-black capitalize leading-tight">{exercise.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {exercise.target && (
                                            <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                                                {exercise.target}
                                            </span>
                                        )}
                                        {exercise.equipment && (
                                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                                {exercise.equipment.replace(/_/g, ' ')}
                                            </span>
                                        )}
                                        {exercise.body_part && (
                                            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                                                {exercise.body_part}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full bg-secondary/50 hover:bg-secondary shrink-0"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto space-y-8 scroll-smooth no-scrollbar">
                                {/* Media: Supabase Storage GIF */}
                                <div className="w-full aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-md border border-black/5 dark:border-white/5 overflow-hidden flex items-center justify-center relative">
                                    {mediaUrl && !imageError ? (
                                        <img
                                            src={mediaUrl}
                                            alt={`Demonstration of ${exercise.name}`}
                                            className="w-full h-full object-contain"
                                            loading="lazy"
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center text-muted-foreground/40">
                                            <Dumbbell className="w-16 h-16 mb-2" />
                                            <span className="text-sm font-bold uppercase tracking-widest">{t('no_image_available')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Instructions */}
                                {exercise.instructions && exercise.instructions.length > 0 && (
                                    <div className="space-y-4 relative">
                                        <h4 className="text-lg font-black tracking-tight">{t('instructions')}</h4>
                                        <ol className="space-y-4">
                                            {exercise.instructions.map((step, index) => (
                                                <li key={index} className="flex gap-4">
                                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-black shrink-0 mt-0.5">
                                                        {index + 1}
                                                    </span>
                                                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                                        {step}
                                                    </p>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
