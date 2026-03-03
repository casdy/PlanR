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
import type { DbExercise } from '../services/wgerService';
import { fetchWgerMedia } from '../services/wgerService';
import { Play, Pause, Square, SkipForward, Maximize2, Mic, Check, Loader2, X, Dumbbell } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { aiService } from '../services/aiService';
import { groqService } from '../services/groqService';
import { LocalService } from '../services/localService';
import { useTrainingMode } from '../hooks/useTrainingMode';
import { usePerformance } from '../hooks/usePerformance';
import { adjustProgram } from '../engine/progressionEngine';
import type { WorkoutTemplate } from '../engine/types';


// Helper to format time properties
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

export const ActiveWorkoutOverlay = () => {
    const {
        status, activeProgramId, activeDayId, activeExerciseIndex,
        elapsedSeconds, timerDuration, isMinimized, setIsMinimized,
        tick, nextExercise, pauseWorkout, resumeWorkout, cancelWorkout,
        exerciseLogs, logExerciseSet, markExerciseCompleted
    } = useWorkoutStore();

    const { isRecording, startRecording, stopRecording, audioBlob } = useVoiceRecorder();
    const [isProcessingVoice, setIsProcessingVoice] = React.useState(false);
    const [voiceFeedback, setVoiceFeedback] = React.useState<string | null>(null);

    const { user } = useAuth();
    const [program, setProgram] = React.useState<WorkoutProgram | null>(null);
    const [day, setDay] = React.useState<WorkoutDay | null>(null);
    const [exerciseDetails, setExerciseDetails] = React.useState<DbExercise | null>(null);
    const [wgerMediaUrl, setWgerMediaUrl] = React.useState<string>('');
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
            // Automatically maximize if navigating to the dedicated history tab (e.g. reviewing past workouts)
            // or if the workout just started and we haven't actually navigated away yet
            if (location.pathname === '/history') {
                setIsMinimized(false);
            } else if (location.pathname !== lastPath) {
                // User navigated somewhere else while a workout is active -> Minimize it
                setIsMinimized(true);
            }
            // else: Do nothing. (This allows startWorkout() which sets isMinimized=false to keep it maximized)
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
                    const { LocalService } = await import('../services/localService');
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
                            
                            // Transform for engine representation
                            const template: WorkoutTemplate = {
                                id: d.id,
                                title: d.title,
                                exercises: d.exercises.map(ex => ({
                                    id: ex.name, // Engine keys off of exercise_id (using name for V1)
                                    name: ex.name,
                                    targetSets: ex.targetSets,
                                    targetReps: ex.targetReps,
                                    rpeTarget: undefined
                                }))
                            };

                            const { adjustedTemplate } = adjustProgram(template, history, trainingMode);
                            
                            // Map adjustments back to the WorkoutDay format
                            const adjustedDay: WorkoutDay = {
                                ...d,
                                exercises: d.exercises.map((ex, i) => {
                                    const adj = adjustedTemplate.exercises[i];
                                    return {
                                        ...ex,
                                        targetSets: adj.targetSets,
                                        notes: adj.targetWeight ? `Target Weight: ${adj.targetWeight}lbs. ${ex.notes || ''}` : ex.notes
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
            const exName = day.exercises[activeExerciseIndex]?.name;
            if (exName) {
                setExerciseDetails(null);
                setWgerMediaUrl('');
                
                // Fetch details from our Supabase table
                const fetchExercise = async () => {
                    try {
                        const { data, error } = await supabase
                            .from('exercises')
                            .select('*')
                            .eq('name', exName)
                            .single();
                        
                        if (!error && data) {
                            setExerciseDetails(data as DbExercise);
                        }
                    } catch (e: any) {
                        console.error("Failed to load exercise info by name", e);
                    }
                };
                fetchExercise();

                // Eagerly fetch authoritative media from Live API
                fetchWgerMedia(exName).then(url => {
                    if (url) setWgerMediaUrl(url);
                });
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
                // Mark current exercise as complete before moving on
                if (day.exercises[activeExerciseIndex]) {
                    const ex = day.exercises[activeExerciseIndex];
                    markExerciseCompleted(ex.id, ex.name);
                }
                LocalService.toggleExerciseCompliance(activeProgramId, activeDayId, activeExerciseIndex);
                
                nextExercise(day.exercises.length - 1);
            }
        }
    }, [elapsedSeconds, timerDuration, status, day, nextExercise, activeProgramId, activeDayId, activeExerciseIndex, user]);

    // Voice processing effect
    useEffect(() => {
        async function processAudio() {
            if (audioBlob && activeProgramId && activeDayId) {
                setIsProcessingVoice(true);
                setVoiceFeedback("Transcribing...");
                try {
                    const transcription = await groqService.transcribeAudio(audioBlob);
                    setVoiceFeedback(`Parsing: "${transcription.text}"`);
                    
                    const result = await aiService.parseWorkoutTranscript(transcription.text);
                    if (result && (result.reps > 0 || result.weight > 0)) {
                        const exName = day?.exercises[activeExerciseIndex]?.name;
                        logExerciseSet(activeProgramId, activeDayId, activeExerciseIndex, result.reps, result.weight, currentRpe, exName);
                        if (day?.exercises[activeExerciseIndex]) {
                            const ex = day.exercises[activeExerciseIndex];
                            markExerciseCompleted(ex.id, ex.name);
                        }
                        setVoiceFeedback(`Logged: ${result.reps} reps @ ${result.weight}lbs`);
                        setTimeout(() => setVoiceFeedback(null), 3000);
                    } else {
                        setVoiceFeedback("Couldn't understand reps/weight.");
                        setTimeout(() => setVoiceFeedback(null), 3000);
                    }
                } catch (err) {
                    console.error("Voice processing failed", err);
                    setVoiceFeedback("Voice processing error.");
                    setTimeout(() => setVoiceFeedback(null), 3000);
                } finally {
                    setIsProcessingVoice(false);
                }
            }
        }
        processAudio();
    }, [audioBlob, activeProgramId, activeDayId, activeExerciseIndex, logExerciseSet, currentRpe]);


    if (status === 'idle' || status === 'finished' || !day || !program) return null;

    const currentExercise = day.exercises[activeExerciseIndex];
    const nextEx = day.exercises[activeExerciseIndex + 1];

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
                            <h3 className="font-bold text-lg truncate pr-2">{currentExercise.name}</h3>
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
                                <h3 className="text-3xl font-black capitalize leading-tight">{currentExercise.name}</h3>
                                {exerciseDetails ? (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                                            {exerciseDetails.target}
                                        </span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                            {exerciseDetails.equipment.replace('_', ' ')}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                                            {currentExercise.targetSets} SETS
                                        </span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                            {currentExercise.targetReps} REPS
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
                            {/* Media Container */}
                            <div className="w-full aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-md border border-black/5 dark:border-white/5 overflow-hidden flex items-center justify-center relative">
                                {wgerMediaUrl ? (
                                    <img 
                                        src={wgerMediaUrl} 
                                        alt={currentExercise.name} 
                                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" 
                                        loading="lazy" 
                                    />
                                ) : exerciseDetails?.gif_url ? (
                                    <img 
                                        src={exerciseDetails.gif_url.startsWith('http') ? `/api/cdn-proxy?url=${encodeURIComponent(exerciseDetails.gif_url)}` : exerciseDetails.gif_url} 
                                        alt={currentExercise.name} 
                                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" 
                                        loading="lazy" 
                                    />
                                ) : (
                                    <div className="w-full aspect-square sm:aspect-video bg-white/5 rounded-2xl flex flex-col items-center justify-center text-muted-foreground/40 border border-white/5">
                                        <Dumbbell className="w-16 h-16 mb-2" />
                                        <span className="text-sm font-bold uppercase tracking-widest">No Media Available</span>
                                    </div>
                                )}
                            </div>

                            {/* Timer Display */}
                            <div className="flex flex-col items-center justify-center py-2">
                                <div className="text-7xl font-black tracking-tightest tabular-nums animate-float">
                                    {formatTime(elapsedSeconds)}
                                </div>
                                <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-2">
                                    TARGET: {formatTime(timerDuration)}
                                </div>
                            </div>
                            
                            {/* RPE Slider */}
                            <div className="py-2 space-y-3">
                                <div className="flex justify-between items-end px-1">
                                    <div>
                                        <label className="text-sm font-black tracking-tight block">RPE</label>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Rate of Perceived Exertion</span>
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
                                    <span>1 (Easy)</span>
                                    <span>10 (Max Effort)</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="grid grid-cols-4 gap-3 relative">
                                <Button size="lg" variant="secondary" onClick={(e) => { e.stopPropagation(); cancelWorkout(); }} className="flex-col h-20 gap-2 border-none bg-zinc-50 dark:bg-zinc-800">
                                    <Square className="w-5 h-5 fill-red-500 text-red-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">End</span>
                                </Button>

                                {status === 'running' ? (
                                    <Button size="lg" onClick={(e) => { e.stopPropagation(); pauseWorkout(); }} className="flex-col h-20 gap-2 bg-yellow-500 hover:bg-yellow-600 border-none shadow-lg shadow-yellow-500/20">
                                        <Pause className="w-6 h-6 fill-white" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">Pause</span>
                                    </Button>
                                ) : (
                                    <Button size="lg" onClick={(e) => { e.stopPropagation(); resumeWorkout(); }} className="flex-col h-20 gap-2 bg-emerald-500 hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/20">
                                        <Play className="w-6 h-6 fill-white ml-1" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">Resume</span>
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
                                            {isRecording ? "Listening" : "Log"}
                                        </span>
                                    </Button>
                                    {isRecording && (
                                        <div className="absolute inset-0 rounded-xl ring-4 ring-red-500/30 animate-ping pointer-events-none" />
                                    )}
                                </div>

                                <Button size="lg" variant="secondary" onClick={(e) => { e.stopPropagation(); nextExercise(day.exercises.length - 1); }} className="flex-col h-20 gap-2 border-none bg-zinc-50 dark:bg-zinc-800">
                                    <SkipForward className="w-5 h-5 opacity-60" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Skip</span>
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

                            {/* Set History */}
                            {exerciseLogs[`${activeProgramId}-${activeDayId}-${activeExerciseIndex}`]?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {exerciseLogs[`${activeProgramId}-${activeDayId}-${activeExerciseIndex}`].map((set, i) => (
                                        <div key={i} className="bg-white/5 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/5">
                                            Set {i + 1}: {set.reps} × {set.weight}lbs
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Instructions */}
                            {exerciseDetails && exerciseDetails.instructions && exerciseDetails.instructions.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xl font-black tracking-tight">Instructions</h4>
                                    <ol className="space-y-4">
                                        {exerciseDetails.instructions.map((step: string, index: number) => (
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

                            {/* Description Fallback (if instructions array is missing but we have a text description) */}
                            {exerciseDetails && !exerciseDetails.instructions && exerciseDetails.description && (
                                <div className="space-y-4">
                                    <h4 className="text-xl font-black tracking-tight">Instructions</h4>
                                    <div className="prose prose-sm dark:prose-invert">
                                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                            {exerciseDetails.description.replace(/<[^>]+>/g, '')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Up Next */}
                            {nextEx && (
                                <div className="pt-6 border-t border-white/5 opacity-80">
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Up Next</p>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-black text-muted-foreground">
                                            {activeExerciseIndex + 2}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg leading-tight">{nextEx.name}</p>
                                            <p className="text-xs font-black uppercase tracking-widest text-primary mt-1">
                                                {nextEx.targetSets} Sets × {nextEx.targetReps} Reps
                                            </p>
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
