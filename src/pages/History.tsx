/**
 * @file src/pages/History.tsx
 * @description Activity Feed page — shows the user's workout history.
 *
 * Renders two sections:
 *  1. `LiveWorkoutCard` — a pulsing card for the currently active/running session.
 *  2. Past logs — a chronological list of completed, paused, and incomplete workout logs.
 *
 * Paused sessions (log.isPaused === true) show a yellow badge and a "Resume" button.
 * Clicking Resume calls `resumeOldWorkout()` which restores the session in `workoutStore`.
 *
 * If a workout has no completedExerciseNames (e.g., started then abandoned immediately),
 * the card falls back to showing the planned exercise list from the program schedule.
 */
import * as React from 'react';
import { Card } from '../components/ui/Card';
import { LocalService } from '../services/localService';
import { ProgressService, type ProgressPhoto } from '../services/progressService';
import { useAuth } from '../hooks/useAuth';
import type { WorkoutLog, WorkoutProgram, WorkoutDay, Exercise } from '../types';
import { Activity, Trash2, XCircle, Play, RotateCcw, Zap, Timer, Dumbbell, Camera, Calendar, ChevronRight, Search } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/ui/Button';
import { ProgressCamera } from '../components/ProgressCamera';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { PopoverTooltip } from '../components/ui/Tooltip';

// ─── Live Workout Card ──────────────────────────────────────────────────────
// Renders entirely from store state so it re-renders every time the timer ticks.
const LiveWorkoutCard = () => {
    const {
        status,
        activeProgramId,
        activeDayId,
        totalSessionSeconds,
        completedExerciseIds,
        activeExerciseIndex,
        resumeWorkout,
        pauseWorkout,
        setIsMinimized,
    } = useWorkoutStore();
    const { t } = useLanguage();

    const [programTitle, setProgramTitle] = React.useState(t('active_session_ready'));
    const [dayTitle, setDayTitle] = React.useState('');
    const [currentExerciseName, setCurrentExerciseName] = React.useState('');

    React.useEffect(() => {
        if (!activeProgramId) return;
        const load = async () => {
            const { LocalService: LS } = await import('../services/localService');
            const progs = LS.getUserPrograms();
            const prog = progs.find(p => p.id === activeProgramId);
            if (prog) {
                setProgramTitle(prog.title || t('active_session_ready'));
                const day = prog.schedule?.find(d => d.id === activeDayId);
                if (day) {
                    setDayTitle(day.title || '');
                    const slot = day.slots?.[activeExerciseIndex];
                    if (slot && slot.entries.length > 0) {
                        setCurrentExerciseName(slot.entries[0].name);
                    }
                }
            }
        };
        load();
    }, [activeProgramId, activeDayId, activeExerciseIndex]);

    const totalExercises = React.useMemo(() => {
        if (!activeProgramId || !activeDayId) return 0;
        const progs = LocalService.getUserPrograms();
        const prog = progs.find(p => p.id === activeProgramId);
        const day = prog?.schedule?.find(d => d.id === activeDayId);
        return day?.slots?.length || 0;
    }, [activeProgramId, activeDayId]);

    const progressPct = totalExercises > 0
        ? Math.round((completedExerciseIds.length / totalExercises) * 100)
        : 0;

    const mins = Math.floor(totalSessionSeconds / 60);
    const secs = totalSessionSeconds % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const isRunning = status === 'running';
    const isPaused = status === 'paused';

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
            <Card className="rounded-[2rem] overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent ring-2 ring-primary/40 shadow-[0_0_40px_-8px_var(--primary)]">
                {/* Pulsing top bar */}
                <div className={cn("h-1 w-full", isRunning ? "bg-primary animate-pulse" : "bg-yellow-400")} />

                <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Zap className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-base">{programTitle}</span>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                        isRunning
                                            ? "text-primary border-primary/30 bg-primary/10 animate-pulse"
                                            : "text-yellow-500 border-yellow-500/30 bg-yellow-500/10"
                                    )}>
                                        {isRunning ? t('live') : t('paused')}
                                    </span>
                                </div>
                                {dayTitle && (
                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{dayTitle}</p>
                                )}
                                {currentExerciseName && (
                                    <p className="text-[10px] text-primary/80 font-bold mt-1 bg-primary/10 inline-block px-1.5 py-0.5 rounded">
                                        {currentExerciseName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="bg-white/5 rounded-2xl p-2 sm:p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-primary mb-1">
                                <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </div>
                            <p className="text-lg sm:text-xl font-black tabular-nums">{timeStr}</p>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">{t('duration')}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-2 sm:p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                                <Dumbbell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </div>
                            <p className="text-lg sm:text-xl font-black tabular-nums">{completedExerciseIds.length}</p>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">{t('done')}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-2 sm:p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                                <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </div>
                            <p className="text-lg sm:text-xl font-black tabular-nums">{activeExerciseIndex + 1}/{totalExercises || '?'}</p>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5 whitespace-nowrap overflow-hidden">{t('exercise')}</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    {totalExercises > 0 && (
                        <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                <span>{t('progress')}</span>
                                <span>{progressPct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="flex-1 rounded-full"
                            onClick={() => {
                                setIsMinimized(false);
                                if (isPaused) resumeWorkout();
                            }}
                        >
                            {isPaused ? <Play className="w-3.5 h-3.5 mr-1.5 fill-white" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
                            {isPaused ? t('resume') : t('open_workout')}
                        </Button>
                        {isRunning && (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="rounded-full"
                                onClick={() => { pauseWorkout(); }}
                            >
                                {t('pause')}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

// ─── History Page ────────────────────────────────────────────────────────────
export const History = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { resumeOldWorkout, startWorkout, status, activeSessionId } = useWorkoutStore();
    const [logs, setLogs] = React.useState<WorkoutLog[]>([]);
    const [progressPhotos, setProgressPhotos] = React.useState<ProgressPhoto[]>([]);
    const [programs, setPrograms] = React.useState<WorkoutProgram[]>([]);
    const [isCameraOpen, setIsCameraOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const isActive = status === 'running' || status === 'paused';

    const loadData = React.useCallback(async () => {
        setIsLoading(true);
        const userId = user?.id || 'guest';
        const fetchedLogs = LocalService.getLogs(userId);
        const fetchedPrograms = LocalService.getUserPrograms();
        
        let fetchedPhotos: ProgressPhoto[] = [];
        if (user && user.id !== 'guest') {
            try {
                fetchedPhotos = await ProgressService.getProgressPhotos(user.id);
            } catch (err) {
                console.error("Failed to fetch progress photos:", err);
            }
        }

        setLogs(fetchedLogs);
        setProgressPhotos(fetchedPhotos);
        setPrograms(fetchedPrograms);
        setIsLoading(false);
    }, [user]);

    // Reload logs when the active session changes (e.g., a new session starts)
    React.useEffect(() => {
        loadData();
    }, [loadData, activeSessionId]);

    const handleDelete = (logId: string) => {
        LocalService.deleteLog(logId);
        setLogs(prev => prev.filter(l => l.id !== logId && l.sessionId !== logId));
    };

    // Filter out the currently active session from history list (it's shown in LiveWorkoutCard)
    const pastLogs = logs.filter(l => l.sessionId !== activeSessionId);

    return (
        <div className="space-y-8 pb-36">
            <header>
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tighter flex items-center gap-3">
                        <Activity className="w-8 h-8 text-primary" />
                        {t('activity_feed')}
                        <PopoverTooltip title={t('activity_feed')}>
                            Your Activity Feed is a chronological record of your training journey. It tracks every session, completed rep, and personal best. The AI uses this data to map your volume trends and fatigue levels.
                        </PopoverTooltip>
                    </h1>
                    <p className="text-muted-foreground font-medium">{t('activity_subtitle')}</p>
                </div>
            </header>

            <AnimatePresence>
                {isCameraOpen && (
                    <ProgressCamera 
                        onClose={() => setIsCameraOpen(false)}
                        onComplete={() => {
                            setIsCameraOpen(false);
                            loadData();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Floating Action Button (FAB) for Camera */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-[110px] right-6 z-40"
            >
                <Button 
                    className="w-16 h-16 rounded-full shadow-2xl shadow-primary/40 p-0 flex items-center justify-center bg-primary"
                    onClick={() => setIsCameraOpen(true)}
                >
                    <Camera className="w-7 h-7" />
                </Button>
            </motion.div>

            <div className="space-y-4">
                {/* Live workout block — always re-renders from store */}
                <AnimatePresence>
                    {isActive && <LiveWorkoutCard />}
                </AnimatePresence>

                {/* Past activities */}
                <AnimatePresence mode="wait">
                    {(pastLogs.length > 0 || progressPhotos.length > 0) ? (
                        <div className="space-y-3">
                            {[
                                ...pastLogs.map(l => ({ type: 'workout' as const, date: l.completedAt || l.date, data: l })),
                                ...progressPhotos.map(p => ({ type: 'photo' as const, date: p.created_at, data: p }))
                            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                             .map((item, idx) => {
                                if (item.type === 'photo') {
                                    const photo = item.data;
                                    return (
                                        <motion.div
                                            key={photo.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Card className="glass border-white/5 rounded-[2rem] overflow-hidden group hover:border-primary/20 transition-all p-4 bg-gradient-to-br from-zinc-900/50 to-black/50">
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-20 sm:w-24 sm:h-32 rounded-2xl border-4 border-white/10 shadow-2xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform cursor-pointer">
                                                        <img src={photo.photo_url} alt="Progress" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Progress Update</span>
                                                        </div>
                                                        <h4 className="font-bold text-lg text-white">
                                                            {photo.body_part || 'Overall Progress'}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground font-medium mb-3">
                                                            {format(new Date(photo.created_at), 'EEEE, MMM do • h:mm a')}
                                                        </p>
                                                        {photo.notes && (
                                                            <p className="text-xs text-white/50 italic line-clamp-2">
                                                                "{photo.notes}"
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={async () => {
                                                            if (confirm('Delete this photo?')) {
                                                                await ProgressService.deleteProgressPhoto(photo.id);
                                                                loadData();
                                                            }
                                                        }}
                                                        className="self-start p-2 text-white/20 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                }

                                const log = item.data;
                                const isComplete = !!log.completedAt;
                                const displayDate = log.completedAt || log.date;
                                
                                const program = programs.find(p => p.id === log.programId);
                                const day = program?.schedule?.find((d: WorkoutDay) => d.id === log.dayId);
                                const programTitle = program ? `${program.title}${day ? ` - ${day.title}` : ''}` : ((log as any).programTitle || 'Strength Session');
                                
                                // Determine which exercise names to show
                                const hasCompleted = log.completedExerciseNames && log.completedExerciseNames.length > 0;
                                const displayExerciseNames = hasCompleted 
                                    ? log.completedExerciseNames 
                                    : (day?.slots?.flatMap(s => s.entries).map(e => e.name) || []);

                                return (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                <Card className="glass border-white/5 rounded-[2rem] overflow-hidden group hover:border-primary/20 transition-all">
                                            <div className="p-4 sm:p-5 flex flex-col gap-4">
                                                {/* Title Row */}
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${isComplete ? 'bg-primary/10 text-primary' : (log.isPaused ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500')}`}>
                                                        {isComplete ? <Activity className="w-5 h-5" /> : (log.isPaused ? <Play className="w-5 h-5" /> : <XCircle className="w-5 h-5" />)}
                                                    </div>
                                                    
                                                    {log.physiquePhotoUrl && (
                                                        <div className="absolute right-6 top-6 w-16 h-20 rounded-2xl border-4 border-white/10 shadow-2xl overflow-hidden rotate-[3deg] scale-100 group-hover:scale-110 group-hover:rotate-[6deg] transition-all hidden sm:block">
                                                            <img src={log.physiquePhotoUrl} alt="Physique" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-base truncate flex items-center gap-2 flex-wrap">
                                                            <span className="truncate">{programTitle}</span>
                                                            {!isComplete && !log.isPaused && (
                                                                <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full shrink-0">{t('incomplete')}</span>
                                                            )}
                                                            {!isComplete && log.isPaused && (
                                                                <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 shrink-0">{t('paused')}</span>
                                                            )}
                                                            {isComplete && (
                                                                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">{t('done')}</span>
                                                            )}
                                                        </h4>
                                                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block mt-0.5">
                                                            {format(new Date(displayDate), 'MMM do, yyyy • h:mm a')}
                                                        </span>
                                                        
                                                        {log.physiquePhotoUrl && (
                                                            <div className="mt-2 sm:hidden rounded-xl overflow-hidden border border-white/10 aspect-video w-full max-w-[200px]">
                                                                <img src={log.physiquePhotoUrl} alt="Physique Update" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}

                                                        {displayExerciseNames && displayExerciseNames.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2 opacity-80">
                                                                {displayExerciseNames.slice(0, 3).map((name: string, i: number) => (
                                                                    <span key={i} className="text-[10px] font-bold bg-white/5 border border-white/5 text-foreground/80 px-2 py-1 rounded-md">
                                                                        {name}
                                                                    </span>
                                                                ))}
                                                                {displayExerciseNames.length > 3 && (
                                                                    <span className="text-[10px] font-bold bg-white/5 border border-white/5 text-muted-foreground px-2 py-1 rounded-md">
                                                                        +{displayExerciseNames.length - 3} {t('more')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Stats and Actions Row */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-3 pl-0 sm:pl-[3.25rem]">
                                                    <div className="flex gap-4 sm:gap-6 items-center">
                                                        <div>
                                                            <p className="text-lg font-black italic text-primary">{(log.totalTimeSpentSec / 60).toFixed(0)}m</p>
                                                            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{t('duration')}</p>
                                                        </div>
                                                        <div className="w-px h-6 bg-border" />
                                                        <div>
                                                            <p className="text-lg font-black italic">{log.completedExerciseIds?.length || 0}</p>
                                                            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{t('moves')}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        {!isComplete && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => resumeOldWorkout(log)}
                                                                    className="h-8 sm:h-9 pr-3 pl-2.5 rounded-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-[11px] sm:text-xs font-black shadow-sm"
                                                                >
                                                                    <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 fill-primary/50" /> {t('resume')}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => { handleDelete(log.id); startWorkout(log.programId, log.dayId, user?.id); }}
                                                                    className="h-8 sm:h-9 pr-3 pl-2.5 rounded-full bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20 text-[11px] sm:text-xs font-black shadow-sm"
                                                                >
                                                                    <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" /> {t('restart')}
                                                                </Button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(log.id)}
                                                            className="p-2 text-muted-foreground hover:text-red-500 transition-colors bg-white/5 hover:bg-white/10 rounded-full ml-auto sm:ml-0"
                                                            title="Delete History"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : !isActive ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-16 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10"
                        >
                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                                <Activity className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black mb-1">{t('no_activity')}</h3>
                            <p className="text-muted-foreground font-medium max-w-xs mx-auto">{t('no_activity_desc')}</p>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
};
