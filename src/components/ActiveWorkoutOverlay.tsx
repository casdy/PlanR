import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuth } from '../hooks/useAuth';
import { ProgramService } from '../services/programService';
import type { WorkoutProgram, WorkoutDay } from '../types';
import { Play, Pause, Square, SkipForward, Maximize2, Mic, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { hfService } from '../services/hfService';
import { LocalService } from '../services/localService';


// Helper to format time properties
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

export const ActiveWorkoutOverlay = () => {
    const {
        status, activeProgramId, activeDayId, activeExerciseIndex,
        elapsedSeconds, timerDuration,
        tick, nextExercise, pauseWorkout, resumeWorkout, cancelWorkout,
        exerciseLogs, logExerciseSet
    } = useWorkoutStore();

    const { isRecording, startRecording, stopRecording, audioBlob } = useVoiceRecorder();
    const [isProcessingVoice, setIsProcessingVoice] = React.useState(false);
    const [voiceFeedback, setVoiceFeedback] = React.useState<string | null>(null);

    const { user } = useAuth();
    const [program, setProgram] = React.useState<WorkoutProgram | null>(null);
    const [day, setDay] = React.useState<WorkoutDay | null>(null);
    const [isMinimized, setIsMinimized] = React.useState(false);

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

                const p = progs.find(p => p.id === activeProgramId);
                if (p) {
                    setProgram(p);
                    const d = p.schedule.find(d => d.id === activeDayId);
                    if (d) setDay(d);
                }
            }
        }
        load();
    }, [activeProgramId, activeDayId, user]);

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
                    const transcription = await hfService.speechToText(audioBlob);
                    setVoiceFeedback(`Parsing: "${transcription.text}"`);
                    
                    const result = await hfService.parseWorkoutTranscript(transcription.text);
                    if (result && (result.reps > 0 || result.weight > 0)) {
                        logExerciseSet(activeProgramId, activeDayId, activeExerciseIndex, result.reps, result.weight);
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
    }, [audioBlob, activeProgramId, activeDayId, activeExerciseIndex, logExerciseSet]);


    if (status === 'idle' || status === 'finished' || !day || !program) return null;

    const currentExercise = day.exercises[activeExerciseIndex];
    const nextEx = day.exercises[activeExerciseIndex + 1];

    // Variants for animations
    const overlayVariants = {
        hidden: { y: '100%', opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } as any },
        minimized: { y: 'calc(100% - 80px)', transition: { type: 'spring', damping: 25, stiffness: 200 } as any }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial="hidden"
                animate={isMinimized ? "minimized" : "visible"}
                exit="hidden"
                variants={overlayVariants}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }} // Just for gesture feel, maybe allow drag to dismiss/minimize
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) setIsMinimized(true);
                    if (info.offset.y < -100) setIsMinimized(false);
                }}
                className={cn(
                    "fixed inset-x-0 bottom-0 z-[60] glass border-t border-border/40 shadow-[0_-32px_64px_-12px_rgba(0,0,0,0.15)] rounded-t-[3rem] overflow-hidden touch-manipulation",
                    !isMinimized ? "h-[92vh] md:h-auto md:max-h-[850px]" : "h-24 cursor-pointer"
                )}
            >
                {/* Handle for dragging */}
                <div
                    className="w-full h-6 flex justify-center items-center cursor-pointer active:opacity-50"
                    onClick={() => setIsMinimized(!isMinimized)}
                >
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                </div>

                {/* Minimized View Header */}
                <div className="px-6 pb-4 flex justify-between items-center h-16">
                    <div onClick={() => setIsMinimized(false)} className="flex-1 cursor-pointer">
                        <h3 className="font-bold text-lg truncate pr-2">{currentExercise.name}</h3>
                        <p className="text-sm text-gray-500">{formatTime(elapsedSeconds)} / {formatTime(timerDuration)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {status === 'running' ? (
                            <Button variant="ghost" size="icon" onClick={() => pauseWorkout()} className="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <Pause className="w-5 h-5 fill-current" />
                            </Button>
                        ) : (
                            <Button variant="ghost" size="icon" onClick={() => resumeWorkout()} className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <Play className="w-5 h-5 fill-current" />
                            </Button>
                        )}
                        {isMinimized && (
                            <Button variant="ghost" size="icon" onClick={() => setIsMinimized(false)}>
                                <Maximize2 className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Expanded View Content */}
                {!isMinimized && (
                    <div className="px-6 pb-safe h-full overflow-y-auto">
                        {/* Main Timer Display */}
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="relative w-64 h-64 flex items-center justify-center">
                                {/* Progress Ring (SVG) */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                                    <circle
                                        cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent"
                                        className="text-blue-500 transition-all duration-1000 ease-linear"
                                        strokeDasharray={2 * Math.PI * 120}
                                        strokeDashoffset={(2 * Math.PI * 120) * (1 - elapsedSeconds / timerDuration)} // Counter-intuitively implies logic, but simplified
                                    />
                                </svg>
                                <div className="text-center z-10">
                                    <div className="text-7xl font-black tracking-tightest tabular-nums animate-float">
                                        {formatTime(elapsedSeconds)}
                                    </div>
                                    <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-2">
                                        TARGET: {formatTime(timerDuration)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-4 gap-3 mb-8">
                            <Button size="lg" variant="secondary" onClick={cancelWorkout} className="flex-col h-20 gap-2 border-none bg-gray-50 dark:bg-slate-800">
                                <Square className="w-5 h-5 fill-red-500 text-red-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">End</span>
                            </Button>

                            {status === 'running' ? (
                                <Button size="lg" onClick={pauseWorkout} className="flex-col h-20 gap-2 bg-yellow-500 hover:bg-yellow-600 border-none shadow-lg shadow-yellow-500/20">
                                    <Pause className="w-6 h-6 fill-white" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Pause</span>
                                </Button>
                            ) : (
                                <Button size="lg" onClick={resumeWorkout} className="flex-col h-20 gap-2 bg-emerald-500 hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/20">
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
                                    onMouseDown={startRecording}
                                    onMouseUp={stopRecording}
                                    onTouchStart={startRecording}
                                    onTouchEnd={stopRecording}
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

                            <Button size="lg" variant="secondary" onClick={() => nextExercise(day.exercises.length - 1)} className="flex-col h-20 gap-2 border-none bg-gray-50 dark:bg-slate-800">
                                <SkipForward className="w-5 h-5 opacity-60" />
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Skip</span>
                            </Button>
                        </div>

                        {/* Info Card */}
                        <Card className="bg-secondary/40 border-none relative overflow-visible rounded-[2.5rem] mt-4">
                            <div className="p-8 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">Current Set</p>
                                    <h2 className="text-3xl font-black tracking-tight">{currentExercise.name}</h2>
                                    <div className="flex gap-4 pt-1">
                                        <p className="text-sm font-black text-muted-foreground uppercase">{currentExercise.targetSets} SETS</p>
                                        <p className="text-sm font-black text-muted-foreground uppercase">{currentExercise.targetReps} REPS</p>
                                    </div>
                                </div>
                            </div>

                            {/* Voice Feedback Overlay */}
                            <AnimatePresence>
                                {voiceFeedback && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        className="absolute -top-12 left-0 right-0 flex justify-center"
                                    >
                                        <div className="bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg border border-slate-700 flex items-center gap-2">
                                            {voiceFeedback.includes("Logged") ? <Check className="w-3 h-3 text-emerald-400" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                                            {voiceFeedback}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Set History */}
                            {exerciseLogs[`${activeProgramId}-${activeDayId}-${activeExerciseIndex}`]?.length > 0 && (
                                <div className="px-4 pb-4 flex flex-wrap gap-2">
                                    {exerciseLogs[`${activeProgramId}-${activeDayId}-${activeExerciseIndex}`].map((set, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-700 px-3 py-1 rounded-lg text-xs font-bold border border-gray-100 dark:border-slate-600">
                                            Set {i + 1}: {set.reps} × {set.weight}lbs
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {nextEx && (
                            <div className="mt-4 opacity-60">
                                <p className="text-sm font-medium mb-2">Up Next:</p>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                                        {activeExerciseIndex + 2}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{nextEx.name}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
