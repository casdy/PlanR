/**
 * @file src/components/ExerciseCard.tsx
 * @description Card UI for displaying a single exercise suggestion on the Dashboard.
 *
 * Shows the exercise name, body part, equipment, and a GIF demo fetched from
 * ExerciseDB. Tapping the card expands a detail panel with step-by-step instructions.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, Dumbbell, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { createPortal } from 'react-dom';
import { getExerciseDetails } from '../services/exerciseDBService';
import type { ExerciseDBItem } from '../services/exerciseDBService';

interface ExerciseCardProps {
    exercise: ExerciseDBItem;
    iconUrl?: string | null;
}

export const ExerciseCard = ({ exercise, iconUrl = null }: ExerciseCardProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailedExercise, setDetailedExercise] = useState<ExerciseDBItem>(exercise);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (isModalOpen && (!detailedExercise.videoUrl || detailedExercise.instructions.length === 0)) {
            setLoadingDetails(true);
            getExerciseDetails(exercise.id)
                .then(details => setDetailedExercise(details))
                .catch(err => console.error("Failed to load details", err))
                .finally(() => setLoadingDetails(false));
        }
    }, [isModalOpen, exercise.id]);

    return (
        <>
            {/* Default Clean UI View (SVG) */}
            <div 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsModalOpen(true);
                }}
                className="flex-shrink-0 min-w-[140px] max-w-[160px] bg-white/5 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/10 dark:border-white/5 cursor-pointer hover:bg-white/10 dark:hover:bg-slate-900/60 transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsModalOpen(true);
                    }
                }}
            >
                {iconUrl ? (
                    <div className="w-12 h-12 bg-white/10 dark:bg-white/5 rounded-xl mb-3 flex items-center justify-center p-2">
                        <img 
                            src={iconUrl} 
                            alt={exercise.name} 
                            className="w-full h-full object-contain filter invert opacity-80" 
                        />
                    </div>
                ) : (
                    <div className="w-12 h-12 bg-white/10 dark:bg-white/5 rounded-xl mb-3 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                )}
                
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{exercise.target}</p>
                <p className="text-sm font-bold truncate leading-tight mb-2">{exercise.name}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60">
                    <span className="bg-white/5 px-2 py-0.5 rounded-full capitalize">{exercise.equipment.replace('_', ' ')}</span>
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
                                        <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                                            {exercise.target}
                                        </span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                            {exercise.equipment.replace('_', ' ')}
                                        </span>
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
                                {/* GIF/Video Container */}
                                <div className="w-full aspect-square bg-white rounded-2xl shadow-md border border-black/5 overflow-hidden flex items-center justify-center p-4 relative">
                                    {loadingDetails && (
                                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-opacity">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loading Media...</span>
                                        </div>
                                    )}
                                    {detailedExercise.videoUrl ? (
                                        <video 
                                            src={detailedExercise.videoUrl} 
                                            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                        />
                                    ) : detailedExercise.gifUrl && !imageError ? (
                                        <img 
                                            src={detailedExercise.gifUrl} 
                                            alt={`Demonstration of ${detailedExercise.name}`} 
                                            className="w-full h-full object-contain mix-blend-multiply"
                                            loading="lazy"
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center text-muted-foreground/40">
                                            <Dumbbell className="w-16 h-16 mb-2" />
                                            <span className="text-sm font-bold uppercase tracking-widest">No Video Available</span>
                                        </div>
                                    )}
                                </div>
                                {detailedExercise.instructions && detailedExercise.instructions.length > 0 && (
                                    <div className="space-y-4 relative">
                                        <h4 className="text-lg font-black tracking-tight">Instructions</h4>
                                        <ol className="space-y-4">
                                            {detailedExercise.instructions.map((step, index) => (
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
