/**
 * @file src/components/ActiveWorkoutOverlay.tsx
 * @description Floating persistent workout overlay shown during active sessions.
 *
 * Renders over the bottom navigation bar when `workoutStore.status` is `running`
 * or `paused`. The overlay walks the user through each exercise in the active
 * program day, shows GIF demos via `ExerciseImage`, and supports voice logging,
 * intensity scaling, recovery swaps, and manual set entry.
 *
 * Key states:
 *  - Minimised pill → tap to expand into the full panel
 *  - Expanded panel → shows exercise detail, timer, set logger, and nav buttons
 *  - Finished → transitions to `WorkoutSummary` achievement screen
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuth } from '../hooks/useAuth';
import { ProgramService } from '../services/programService';
import type { WorkoutProgram, WorkoutDay } from '../types';
import { supabase } from '../lib/supabase';
import type { DbExercise } from '../services/exerciseService';
import { getExerciseImageUrl } from '../services/exerciseService';
import { Play, Pause, Square, SkipForward, Maximize2, Mic, Check, Loader2, X, Dumbbell } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useLanguage } from '../hooks/useLanguage';
import { aiService } from '../services/aiService';
import { groqService } from '../services/groqService';
import { LocalService } from '../services/localService';
import { useTrainingMode } from '../hooks/useTrainingMode';
import { usePerformance } from '../hooks/usePerformance';
import { adjustProgram } from '../engine/progressionEngine';
import type { WorkoutTemplate } from '../engine/types';
import { ProgressCamera } from './ProgressCamera';


// Helper to format time properties
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

export const ActiveWorkoutOverlay = () => {
    const {
        status, activeProgramId, activeDayId, activeExerciseIndex, activeSessionId,
        elapsedSeconds, timerDuration, isMinimized, setIsMinimized,
        tick, nextExercise, pauseWorkout, resumeWorkout, cancelWorkout,
        logExerciseSet, markExerciseCompleted, completePhysiqueCapture
    } = useWorkoutStore();
    const { t } = useLanguage();

    const { isRecording, startRecording, stopRecording, audioBlob } = useVoiceRecorder();
    const [isProcessingVoice, setIsProcessingVoice] = React.useState(false);
    const [voiceFeedback, setVoiceFeedback] = React.useState<string | null>(null);

    const { user } = useAuth();
    const [program, setProgram] = React.useState<WorkoutProgram | null>(null);
    const [day, setDay] = React.useState<WorkoutDay | null>(null);
    const [exerciseDetails, setExerciseDetails] = React.useState<DbExercise | null>(null);
    const [exerciseMediaUrl, setExerciseMediaUrl] = React.useState<string>('');
    const location = useLocation();

    // Keep track of the previous pathname to detect actual navigation events after starting
    const [lastPath, setLastPath] = React.useState(location.pathname);

    // Adaptive Performance Engine specific states
    const { trainingMode } = useTrainingMode();
    const { fetchPerformanceHistory } = usePerformance();
    const [currentRpe, setCurrentRpe] = React.useState<number>(8);

    // Handle Route Changes & Maximization Rules
    useEffect(() => {
        if (status === 'running' || status === 'paused') {
            // Automatically maximize if navigating to the history tab for the FIRST time in this session
            // across renders, or if the user explicitly opens it.
            if (location.pathname === '/history') {
                // If we're on history, we usually want to see the active details, 
                // but let's allow it to stay minimized if the user explicitly dragged it down.
                // For now, auto-maximize is fine for "opening" the view.
                setIsMinimized(false);
            } else if (location.pathname !== lastPath) {
                // User navigated somewhere else while a workout is active -> Minimize it
                setIsMinimized(true);
            }
        }
        setLastPath(location.pathname);
    }, [location.pathname, status, setIsMinimized, lastPath]);

    // Fetch program data when active
    useEffect(() => {
        async function load() {
            if (activeProgramId) {
                // Determine source
                let progs: WorkoutProgram[] = [];
                if (user) {
                    progs = await ProgramService.getUserPrograms(user.id);
                } else {
                    progs = LocalService.getUserPrograms();
                }

                const p = progs.find(prog => prog.id === activeProgramId);
                if (p) {
                    setProgram(p);
                    const d = p.schedule.find(dayProg => dayProg.id === activeDayId);
                    if (d) {
                        // Apply engine adjustments before setting into active state
                        if (user && user.id !== 'guest') {
                            const history = await fetchPerformanceHistory();
                            
                            const daySlots = d.slots ?? [];

                            // Transform for engine representation
                            const template: WorkoutTemplate = {
                                id: d.id,
                                title: d.title,
                                slots: daySlots.map(slot => ({
                                    id: slot.id,
                                    type: slot.type,
                                    entries: (slot.entries ?? []).map(ex => ({
                                        id: ex.name,
                                        name: ex.name,
                                        targetSets: ex.targetSets,
                                        targetReps: ex.targetReps,
                                        targetWeight: ex.weight
                                    }))
                                }))
                            };

                            const { adjustedTemplate } = adjustProgram(template, history, trainingMode);
                            
                            // Map adjustments back to the WorkoutDay format
                            const adjustedDay: WorkoutDay = {
                                ...d,
                                slots: daySlots.map((slot, i) => {
                                    const adjSlot = adjustedTemplate.slots[i];
                                    return {
                                        ...slot,
                                        entries: (slot.entries ?? []).map((entry, j) => {
                                            const adjEntry = adjSlot?.entries[j];
                                            return {
                                                ...entry,
                                                targetSets: adjEntry?.targetSets ?? entry.targetSets,
                                                notes: adjEntry?.targetWeight ? `Target Weight: ${adjEntry.targetWeight}lbs. ${entry.notes || ''}` : entry.notes
                                            };
                                        })
                                    };
                                })
                            };
                            setDay(adjustedDay);
                        } else {
                            // Guest mode retains original program layout
                            setDay(d);
                        }
                    }
                }
            }
        }
        load();
    }, [activeProgramId, activeDayId, user, trainingMode]);

    // Fetch rich exercise details for the active screen
    useEffect(() => {
        if (day && activeExerciseIndex !== undefined) {
            const currentSlot = day.slots[activeExerciseIndex];
            const firstEntry = currentSlot?.entries[0];
            const exName = firstEntry?.name;
            if (exName) {
                setExerciseDetails(null);
                setExerciseMediaUrl('');
                
                // Fetch details from our Supabase table
                const fetchExercise = async () => {
                    try {
                        const { data, error } = await supabase
                            .from('exercises')
                            .select('*')
                            .ilike('name', exName)
                            .maybeSingle();
                        
                        if (!error && data) {
                            setExerciseDetails(data as DbExercise);
                            const url = getExerciseImageUrl(data as DbExercise);
                            if (url) setExerciseMediaUrl(url);
                        }
                    } catch (e: any) {
                        console.error("Failed to load exercise info by name", e);
                    }
                };
                fetchExercise();
            }
        }
    }, [day, activeExerciseIndex]);

    // Timer Effect
    useEffect(() => {
        let interval: any;
        if (status === 'running') {
            interval = setInterval(() => {
                tick();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, tick]);

    // Utility to play a non-intrusive notification beep
    const playBeep = () => {
        const soundsEnabled = localStorage.getItem('planr-sounds') !== 'false';
        if (!soundsEnabled) return;

        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            console.warn('Audio feedback failed', e);
        }
    };

    // Auto-advance logic
    useEffect(() => {
        if (elapsedSeconds >= timerDuration && status === 'running') {
            playBeep();
            if (day && activeProgramId && activeDayId) {
                // Mark all entries in current slot as complete before moving on
                const currentSlot = day.slots[activeExerciseIndex];
                if (currentSlot) {
                    currentSlot.entries.forEach(entry => {
                        markExerciseCompleted(entry.id, entry.name);
                    });
                }
                LocalService.toggleExerciseCompliance(activeProgramId, activeDayId, activeExerciseIndex);
                
                nextExercise(day.slots.length - 1);
            }
        }
    }, [elapsedSeconds, timerDuration, status, day, nextExercise, activeProgramId, activeDayId, activeExerciseIndex, user]);

    // Voice processing effect
    useEffect(() => {
        async function processAudio() {
            if (audioBlob && activeProgramId && activeDayId) {
                setIsProcessingVoice(true);
                setVoiceFeedback(t('transcribing'));
                try {
                    const transcription = await groqService.transcribeAudio(audioBlob);
                    setVoiceFeedback(`Parsing: "${transcription.text}"`);
                    
                    const result = await aiService.parseWorkoutTranscript(transcription.text);
                    if (result && (result.reps > 0 || result.weight > 0)) {
                        const currentSlot = day?.slots[activeExerciseIndex];
                        const primaryEntry = currentSlot?.entries[0];
                        const exName = primaryEntry?.name;
                        
                        logExerciseSet(activeProgramId, activeDayId, activeExerciseIndex, result.reps, result.weight, currentRpe, exName);
                        if (primaryEntry) {
                            markExerciseCompleted(primaryEntry.id, primaryEntry.name);
                        }
                        setVoiceFeedback(`Logged: ${result.reps} reps @ ${result.weight}lbs`);
                        setTimeout(() => setVoiceFeedback(null), 3000);
                    } else {
                        setVoiceFeedback(t('couldnt_understand'));
                        setTimeout(() => setVoiceFeedback(null), 3000);
                    }
                } catch (err) {
                    console.error("Voice processing failed", err);
                    setVoiceFeedback(t('voice_processing_error'));
                    setTimeout(() => setVoiceFeedback(null), 3000);
                } finally {
                    setIsProcessingVoice(false);
                }
            }
        }
        processAudio();
    }, [audioBlob, activeProgramId, activeDayId, activeExerciseIndex, logExerciseSet, currentRpe]);


    if (status === 'physique_capture') {
        return (
            <ProgressCamera 
                sessionId={activeSessionId!} 
                onComplete={(url) => completePhysiqueCapture(url)}
                onClose={() => completePhysiqueCapture()}
            />
        );
    }

    // Never return null if a workout is active—show a skeleton instead.
    // This allows the "Open Workout" button to expand even if data is still loading.
    const isActuallyActive = status === 'running' || status === 'paused';
    if (!isActuallyActive) return null;

    if (!day || !program) {
        return (
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                className="fixed inset-x-2 bottom-[100px] z-[60] h-32 bg-zinc-900/90 rounded-[2.5rem] border border-white/10 flex items-center justify-center gap-3 backdrop-blur-xl"
            >
                <div className="w-12 h-12 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-primary/40" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-white/5 rounded animate-pulse opacity-50" />
                </div>
            </motion.div>
        );
    }

    const currentSlot = day.slots[activeExerciseIndex];
    if (!currentSlot) return null;

    const currentEntry = currentSlot.entries[0]; // Primary exercise in focus
    const nextSlot = day.slots[activeExerciseIndex + 1];

    // Variants for animations
    const overlayVariants = {
        hidden: { y: '100%', opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } as any },
        minimized: { y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } as any }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial="hidden"
                animate={isMinimized ? "minimized" : "visible"}
                exit="hidden"
                variants={overlayVariants}
                className={cn(
                    "fixed z-[60] glass shadow-[0_-32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300 flex flex-col",
                    !isMinimized 
                        ? "inset-x-0 bottom-[100px] max-h-[calc(100dvh-120px)] rounded-[2.5rem] border border-white/10 mx-2" 
                        : "inset-x-4 h-20 bottom-[100px] rounded-[2rem] border border-border/40 ring-1 ring-white/10"
                )}
            >
                {/* Drag Handle — drag is ONLY on this strip so buttons below are never intercepted */}
                <motion.div
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.15}
                    onDragEnd={(_, info) => {
                        if (info.offset.y > 60) setIsMinimized(true);
                        if (info.offset.y < -60) setIsMinimized(false);
                    }}
                    onClick={() => isMinimized && setIsMinimized(false)}
                    className="w-full h-8 pt-2 shrink-0 flex justify-center items-center cursor-grab active:cursor-grabbing active:opacity-50 select-none touch-none"
                    style={{ touchAction: 'none' }}
                >
                    <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                </motion.div>

                {isMinimized ? (
                    <div className="px-6 pb-2 shrink-0 flex justify-between items-center min-h-[4rem]">
                        <div onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }} className="flex-1 cursor-pointer">
                            <h3 className="font-bold text-lg truncate pr-2">{currentEntry.name}</h3>
                            <p className="text-sm text-zinc-500">{formatTime(elapsedSeconds)} / {formatTime(timerDuration)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {status === 'running' ? (
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); pauseWorkout(); }} className="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    <Pause className="w-5 h-5 fill-current" />
                                </Button>
                            ) : (
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); resumeWorkout(); }} className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <Play className="w-5 h-5 fill-current" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}>
                                <Maximize2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Expanded Modal-style Header */}
                        <div className="px-6 py-4 border-b border-white/5 flex items-start justify-between z-10 shrink-0">
                            <div className="pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    {currentSlot.type !== 'normal' && (
                                        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                            {currentSlot.type}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-3xl font-black capitalize leading-tight">{currentEntry.name}</h3>
                                {exerciseDetails ? (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                                            {exerciseDetails.target}
                                        </span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                            {exerciseDetails.equipment?.replace('_', ' ')}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                                            {currentEntry.targetSets} {t('sets')}
                                        </span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                            {currentEntry.targetReps} {t('reps')}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-full bg-secondary/50 hover:bg-secondary shrink-0" 
                                onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Expanded View Content */}
                        <div className="p-6 pb-8 overflow-y-auto space-y-8 scroll-smooth no-scrollbar w-full flex-1 overscroll-none">
                            {/* Side-by-Side Grid Layout (PRD Phase 2) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                {/* MEDIA SIDE */}
                                <div className="space-y-4">
                                    <div className="w-full aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-3xl shadow-xl border border-black/5 dark:border-white/5 overflow-hidden flex items-center justify-center relative">
                                        {exerciseMediaUrl ? (
                                            <img 
                                                src={exerciseMediaUrl} 
                                                alt={currentEntry.name} 
                                                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-4" 
                                                loading="lazy" 
                                            />
                                        ) : currentEntry.imageUrl ? (
                                            <img 
                                                src={currentEntry.imageUrl} 
                                                alt={currentEntry.name} 
                                                className="w-full h-full object-cover" 
                                                loading="lazy" 
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
                                                <Dumbbell className="w-12 h-12 opacity-20" />
                                                <span className="text-xs uppercase tracking-widest font-medium opacity-50">{t('no_media')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Timer Display anchored to Media Side on Desktop */}
                                    <div className="hidden md:flex flex-col items-center justify-center p-6 bg-secondary/20 rounded-3xl border border-white/5">
                                        <div className="text-6xl font-black tracking-tightest tabular-nums font-mono">
                                            {formatTime(elapsedSeconds)}
                                        </div>
                                        <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-2">
                                            {t('target')}: {formatTime(timerDuration)}
                                        </div>
                                    </div>
                                </div>

                                {/* INSTRUCIONS & LOGGING SIDE */}
                                <div className="space-y-8">
                                    {/* Mobile Timer (hidden on MD) */}
                                    <div className="md:hidden flex flex-col items-center justify-center py-2">
                                        <div className="text-7xl font-black tracking-tightest tabular-nums">
                                            {formatTime(elapsedSeconds)}
                                        </div>
                                        <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-2">
                                            {t('target')}: {formatTime(timerDuration)}
                                        </div>
                                    </div>

                                    {/* Instructions Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-8 bg-primary rounded-full" />
                                            <h4 className="text-2xl font-black tracking-tight">{t('instructions')}</h4>
                                        </div>
                                        
                                        {currentEntry.notes && (
                                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 italic text-sm text-primary font-medium">
                                                {currentEntry.notes}
                                            </div>
                                        )}

                                        {exerciseDetails?.instructions ? (
                                            <ol className="space-y-4">
                                                {exerciseDetails.instructions.map((step: string, index: number) => (
                                                    <li key={index} className="flex gap-4">
                                                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-foreground text-[10px] font-black mt-0.5">
                                                            {index + 1}
                                                        </span>
                                                        <p className="text-sm text-foreground/80 leading-relaxed font-semibold">
                                                            {step}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ol>
                                        ) : (
                                            <p className="text-muted-foreground text-sm font-medium">
                                                {exerciseDetails?.description?.replace(/<[^>]+>/g, '') || t('no_instructions_available')}
                                            </p>
                                        )}
                                    </div>
                                
                                    {/* Superset Indicator for Slot */}
                                    {currentSlot.entries.length > 1 && (
                                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                                            <h5 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-2">Superset Part of:</h5>
                                            <div className="space-y-2">
                                                {currentSlot.entries.map((entry, idx) => (
                                                    <div key={entry.id} className={cn(
                                                        "text-sm font-bold flex items-center gap-2",
                                                        idx === 0 ? "text-foreground" : "opacity-40"
                                                    )}>
                                                        <Dumbbell className="w-3 h-3" />
                                                        {entry.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* RPE Slider */}
                            <div className="py-2 space-y-3">
                                <div className="flex justify-between items-end px-1">
                                    <div>
                                        <label className="text-sm font-black tracking-tight block">RPE</label>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('rate_of_exertion')}</span>
                                    </div>
                                    <span className={cn(
                                        "text-2xl font-black",
                                        currentRpe >= 9 ? "text-red-500" : currentRpe >= 7 ? "text-amber-500" : "text-emerald-500"
                                    )}>{currentRpe}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    step="0.5"
                                    value={currentRpe} 
                                    onChange={(e) => setCurrentRpe(parseFloat(e.target.value))}
                                    className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-1">
                                    <span>1 ({t('easy')})</span>
                                    <span>10 ({t('max_effort')})</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="grid grid-cols-4 gap-3 relative">
                                <Button size="lg" variant="secondary" onClick={(e) => { e.stopPropagation(); cancelWorkout(); }} className="flex-col h-20 gap-2 border-none bg-zinc-50 dark:bg-zinc-800">
                                    <Square className="w-5 h-5 fill-red-500 text-red-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{t('end')}</span>
                                </Button>

                                {status === 'running' ? (
                                    <Button size="lg" onClick={(e) => { e.stopPropagation(); pauseWorkout(); }} className="flex-col h-20 gap-2 bg-yellow-500 hover:bg-yellow-600 border-none shadow-lg shadow-yellow-500/20">
                                        <Pause className="w-6 h-6 fill-white" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t('pause')}</span>
                                    </Button>
                                ) : (
                                    <Button size="lg" onClick={(e) => { e.stopPropagation(); resumeWorkout(); }} className="flex-col h-20 gap-2 bg-emerald-500 hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/20">
                                        <Play className="w-6 h-6 fill-white ml-1" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t('resume')}</span>
                                    </Button>
                                )}

                                <div className="relative group">
                                    <Button 
                                        size="lg" 
                                        className={cn(
                                            "flex-col h-20 w-full gap-2 transition-all duration-300 border-none shadow-lg",
                                            isRecording ? "bg-red-500 scale-105 shadow-red-500/40" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
                                            isProcessingVoice && "opacity-50 cursor-not-allowed"
                                        )}
                                        onMouseDown={(e) => { e.stopPropagation(); startRecording(); }}
                                        onMouseUp={(e) => { e.stopPropagation(); stopRecording(); }}
                                        onTouchStart={(e) => { e.stopPropagation(); startRecording(); }}
                                        onTouchEnd={(e) => { e.stopPropagation(); stopRecording(); }}
                                        disabled={isProcessingVoice}
                                    >
                                        {isProcessingVoice ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                                        ) : (
                                            <Mic className={cn("w-6 h-6 text-white", isRecording && "animate-bounce")} />
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                                            {isRecording ? t('listening') : t('log_voice')}
                                        </span>
                                    </Button>
                                    {isRecording && (
                                        <div className="absolute inset-0 rounded-xl ring-4 ring-red-500/30 animate-ping pointer-events-none" />
                                    )}
                                </div>

                                <Button size="lg" variant="secondary" onClick={(e) => { e.stopPropagation(); nextExercise(day.slots.length - 1); }} className="flex-col h-20 gap-2 border-none bg-zinc-50 dark:bg-zinc-800">
                                    <SkipForward className="w-5 h-5 opacity-60" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{t('skip')}</span>
                                </Button>
                                
                                {/* Voice Feedback Overlay */}
                                <AnimatePresence>
                                    {voiceFeedback && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                            className="absolute -top-12 left-0 right-0 flex justify-center z-20 pointer-events-none"
                                        >
                                            <div className="bg-zinc-800 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg border border-zinc-700 flex items-center gap-2">
                                                {voiceFeedback.includes("Logged") ? <Check className="w-3 h-3 text-emerald-400" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                                                {voiceFeedback}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>


                            {/* Up Next */}
                            {nextSlot && (
                                <div className="pt-6 border-t border-white/5 opacity-80">
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">{t('up_next')}</p>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-black text-muted-foreground">
                                            {activeExerciseIndex + 2}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black uppercase tracking-widest text-primary mb-0.5">{nextSlot.entries[0].name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground/60">{nextSlot.type}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
