import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { X, Calendar, Play, Loader2, Dumbbell } from 'lucide-react';
import type { ExerciseDBItem } from '../services/exerciseDBService';

interface DailyWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    exercises: { exercise: ExerciseDBItem, icon: string | null }[];
    targetMuscle: string;
    onStartWorkout: () => void;
    onSaveToCalendar: () => void;
    isLoading?: boolean;
}

export const DailyWorkoutModal = ({ 
    isOpen, 
    onClose, 
    exercises, 
    targetMuscle,
    onStartWorkout,
    onSaveToCalendar,
    isLoading = false
}: DailyWorkoutModalProps) => {

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ y: 100, scale: 0.95 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 100, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full max-w-lg bg-card border border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh] min-h-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border/50 flex items-start justify-between bg-card z-10 sticky top-0">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Daily Suggestion</p>
                                <h3 className="text-2xl font-black capitalize leading-tight">Focus: {targetMuscle}</h3>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-full bg-secondary/50 hover:bg-secondary shrink-0" 
                                onClick={onClose}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Body - Exercise List */}
                        <div
                            className="pb-4 px-6 pt-6 overflow-x-auto overflow-y-hidden scroll-smooth flex-1 min-h-0"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            {isLoading || exercises.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4 w-full h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-sm font-bold text-muted-foreground animate-pulse">Forging your workout...</p>
                                </div>
                            ) : (
                                <div className="flex gap-4 w-max h-full min-h-[280px]">
                                    {exercises.map((item, idx) => (
                                        <Card key={idx} className="p-5 bg-secondary/20 border-white/5 rounded-[2rem] flex flex-col items-center text-center gap-4 w-[240px] shrink-0 h-full">
                                            {/* Icon/Visual */}
                                            <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center shrink-0 p-4 border border-white/5">
                                                {item.icon ? (
                                                    <img 
                                                        src={item.icon} 
                                                        alt={item.exercise.name} 
                                                        className="w-full h-full object-contain filter invert opacity-80"
                                                    />
                                                ) : (
                                                    <Dumbbell className="w-8 h-8 text-muted-foreground/50" />
                                                )}
                                            </div>
                                            
                                            {/* Details */}
                                            <div className="flex-1 w-full flex flex-col items-center">
                                                <p className="font-bold text-base leading-tight w-full mb-3 text-balance">{item.exercise.name}</p>
                                                <div className="mt-auto flex flex-col gap-2 w-full items-center">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full truncate max-w-full">
                                                        {item.exercise.target}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full truncate max-w-full">
                                                        {item.exercise.equipment.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Default set/rep scheme suggestion for visual balance */}
                                            <div className="shrink-0 w-full pt-4 border-t border-white/5 mt-auto">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">3 Sets</p>
                                                <p className="text-xl font-black leading-none tabular-nums text-primary">10-12</p>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-card border-t border-border/50 grid grid-cols-2 gap-3 shrink-0">
                            <Button 
                                variant="outline" 
                                className="h-14 rounded-2xl gap-2 font-bold border-white/10"
                                onClick={onSaveToCalendar}
                                disabled={isLoading || exercises.length === 0}
                            >
                                <Calendar className="w-5 h-5" />
                                Save to Calendar
                            </Button>
                            <Button 
                                variant="primary" 
                                className="h-14 rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20"
                                onClick={onStartWorkout}
                                disabled={isLoading || exercises.length === 0}
                            >
                                <Play className="w-5 h-5" />
                                Start Now
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
