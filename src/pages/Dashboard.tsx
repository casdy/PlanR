/**
 * @file src/pages/Dashboard.tsx
 * @description Main home page of PlanR — the first tab users land on.
 *
 * Displays:
 *  - Today's scheduled workout (from CalendarView / scheduleStore)
 *  - Live consistency tracker and streak stats
 *  - "Today's Focus" exercise suggestions powered by ExerciseDB
 *  - Quick-start buttons for today's workout
 *  - The Active Workout Overlay (when a session is live)
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTrainingMode } from '../hooks/useTrainingMode';
import { useRecovery } from '../hooks/useRecovery';
import { usePerformance } from '../hooks/usePerformance';
import { ProgramService } from '../services/programService';
import { LocalService } from '../services/localService';
import { getExercisesByBodyPart, type DbExercise } from '../services/exerciseService';
import type { WorkoutProgram, DeloadResult } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { Loader2, Play, Activity, Flame, TrendingUp, ArrowRight, Calendar, Zap, ChevronRight, Droplets, AlertTriangle, Target, Ruler } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressRing } from '../components/ui/ProgressRing';
import { ExerciseCard } from '../components/ExerciseCard';
import { DailyWorkoutModal } from '../components/DailyWorkoutModal';
import { HolisticInsights } from '../components/HolisticInsights';
import { useCalendarStore } from '../store/calendarStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useToastStore } from '../store/toastStore';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { MeasurementTracker } from '../components/MeasurementTracker';
import { GoalSelectorModal } from '../components/GoalSelectorModal';
import { getUserBiometrics, type UserBiometrics } from '../engine/calorieEngine';
import { checkStrengthRetention } from '../engine/progressionEngine';
import { supabase } from '../lib/supabase';
import { PopoverTooltip } from '../components/ui/Tooltip';
import { AICoachDaily } from '../components/AICoachDaily';

const Tooltip = ({ children, content }: any) => {
    return (
        <div className="relative group">
            {children}
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-50 p-2 bg-black text-white text-xs rounded break-words w-max max-w-xs bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
                {content}
            </div>
        </div>
    );
};

const POWERED_BY = ['Supabase', 'WgerDB', 'ExerciseDB'];

const PoweredBy = () => {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setIdx(i => (i + 1) % POWERED_BY.length), 10800);
        return () => clearInterval(t);
    }, []);
    return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Powered by&nbsp;
            <AnimatePresence mode="wait">
                <motion.span
                    key={idx}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="text-primary inline-block"
                >
                    {POWERED_BY[idx]}
                </motion.span>
            </AnimatePresence>
        </span>
    );
};

import { useLanguage } from '../hooks/useLanguage';

export const Dashboard = () => {
    const { t } = useLanguage();
    const { user, continueAsGuest, loading: authLoading } = useAuth();
    const { trainingMode, updateTrainingMode } = useTrainingMode();
    const { fetchRecentRecoveryLogs } = useRecovery();
    const { checkDeloadStatus, fetchPerformanceHistory } = usePerformance();
    const [recentScore, setRecentScore] = useState<number | null>(null);
    const [fatigueInfo, setFatigueInfo] = useState<DeloadResult | null>(null);
    const navigate = useNavigate();
    
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(0);
    const [weeklyVolume, setWeeklyVolume] = useState(0);
    const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
    const [dailySuggestion, setDailySuggestion] = useState<DbExercise[]>([]);
    const [suggestionMuscle, setSuggestionMuscle] = useState<string>('chest');
    const [suggestionError, setSuggestionError] = useState(false);
    const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [biometrics, setBiometrics] = useState<UserBiometrics | null>(null);
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [measurements, setMeasurements] = useState<any[]>([]);
    const [showStrengthWarning, setShowStrengthWarning] = useState(false);

    const bodyPartsList = ['back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'];

    const fetchDailySuggestion = async (bodyPart: string) => {
        setIsFetchingSuggestion(true);
        setSuggestionMuscle(bodyPart);
        setSuggestionError(false);
        try {
            const exercises = await getExercisesByBodyPart(bodyPart);
            setDailySuggestion(exercises.slice(0, 6));
        } catch (apiError) {
            console.error("Error loading daily suggestions:", apiError);
            setSuggestionError(true);
        } finally {
            setIsFetchingSuggestion(false);
        }
    };
    
    // Calendar store for saving workouts
    const { plannedWorkouts, addPlannedWorkout } = useCalendarStore();
    const showToast = useToastStore(state => state.showToast);

    const handleGuestMode = () => {
        continueAsGuest();
        navigate('/');
    };

    useEffect(() => {
        // Force show the AI Coach for the user's current session so they can verify
        if (localStorage.getItem('dev_force_ai_coach') === null) {
            localStorage.setItem('dev_force_ai_coach', 'true');
        }

        async function load() {
            try {
                if (user) {
                    const userId = user.id; // Use user.id consistently
                    
                    // Fetch recovery if serious mode
                    fetchRecentRecoveryLogs(1).then(logs => {
                        if (logs && logs.length > 0) {
                            // Rough calculation of previous score for preview
                            const rt = logs[0];
                            const s = (rt.sleep_score * 0.3) + ((10 - rt.soreness_score) * 0.2) + ((10 - rt.stress_score) * 0.2) + (rt.energy_score * 0.3);
                            setRecentScore(parseFloat(s.toFixed(1)));
                        }
                    });

                    checkDeloadStatus().then(status => {
                        setFatigueInfo(status);
                    });

                    const [progs, s, vol, bio] = await Promise.all([
                        ProgramService.getUserPrograms(userId),
                        LocalService.getCurrentStreak(userId),
                        LocalService.getWeeklyVolume(userId),
                        getUserBiometrics(userId)
                    ]);
                    setPrograms(progs);
                    setStreak(s);
                    setWeeklyVolume(vol);
                    setBiometrics(bio);
                    
                    if (bio) {
                        // Fetch measurements
                        const { data: measData, error: measError } = await supabase
                            .from('body_measurements')
                            .select('*')
                            .eq('user_id', userId)
                            .order('date', { ascending: true });
                        
                        if (measError) {
                            console.warn('[Dashboard] could not fetch body_measurements. Ensure migrations are run.', measError);
                            setMeasurements([]);
                        } else {
                            setMeasurements(measData || []);
                        }

                        // Check strength retention for a primary compound lift (e.g., 'Bench Press' or first exercise found)
                        // Fetch individual exercise logs for strength monitor
                        const perfLogs = await fetchPerformanceHistory();
                        if (perfLogs.length > 0) {
                            // Find most frequent exercise as a proxy for a primary lift
                            const counts: Record<string, number> = {};
                            perfLogs.forEach(l => { counts[l.exercise_id] = (counts[l.exercise_id] || 0) + 1; });
                            const primaryExerciseId = Object.keys(counts).sort((a,b) => counts[b] - counts[a])[0];
                            
                            const isDeficit = bio.weekly_goal_rate < 0;
                            const hasStrengthDrop = checkStrengthRetention(primaryExerciseId, perfLogs, isDeficit);
                            setShowStrengthWarning(hasStrengthDrop);
                        }
                    }
                    
                    // Simple logic for workouts this week
                    const logs = LocalService.getLogs(userId); // Pass userId to getLogs as well
                    const now = new Date();
                    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                    startOfWeek.setHours(0, 0, 0, 0);
                    const thisWeekLogs = logs.filter(l => new Date(l.completedAt).getTime() >= startOfWeek.getTime());
                    setWorkoutsThisWeek(thisWeekLogs.length);

                    // Fetch Daily Suggestion using ExerciseDB
                    const randomBodyPart = bodyPartsList[Math.floor(Math.random() * bodyPartsList.length)];
                    await fetchDailySuggestion(randomBodyPart);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        
        // Only load data if auth is finished loading
        if (!authLoading) {
            if (user) {
                load();
            } else {
                setLoading(false);
            }
        }
    }, [user, authLoading]);

    // --- Dynamic Health Tips ---
    const HEALTH_TIPS = [
        {
            title: t('tip_hydration_title'),
            desc: t('tip_hydration_desc'),
            icon: Droplets,
            colorClass: "text-blue-500",
            bgClass: "bg-blue-500/20",
            cardClass: "border-blue-500/20 bg-blue-500/5 dark:bg-blue-900/10"
        },
        {
            title: t('tip_protein_title'),
            desc: t('tip_protein_desc'),
            icon: Flame,
            colorClass: "text-orange-500",
            bgClass: "bg-orange-500/20",
            cardClass: "border-orange-500/20 bg-orange-500/5 dark:bg-orange-900/10"
        },
        {
            title: t('tip_sleep_title'),
            desc: t('tip_sleep_desc'),
            icon: Zap,
            colorClass: "text-purple-500",
            bgClass: "bg-purple-500/20",
            cardClass: "border-purple-500/20 bg-purple-500/5 dark:bg-purple-900/10"
        },
        {
            title: t('tip_active_title'),
            desc: t('tip_active_desc'),
            icon: Activity,
            colorClass: "text-emerald-500",
            bgClass: "bg-emerald-500/20",
            cardClass: "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-900/10"
        }
    ];
    
    // Pick a random tip on component mount
    const [dailyTip, setDailyTip] = useState(HEALTH_TIPS[0]);
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * HEALTH_TIPS.length);
        setDailyTip(HEALTH_TIPS[randomIndex]);
    }, []);

    // --- Weekly Consistency Tracker Logic ---
    // Generate grid data for the current calendar year
    const generateConsistencyData = () => {
        if (!user) return [];
        const logs = LocalService.getLogs(user.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const currentYear = today.getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        
        // Find how many days are in this year (handles leap years too)
        const daysInYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0 ? 366 : 365;
        
        const days = [];
        
        // Offset for the first day of the year to align grid columns nicely (0 = Sunday, 1 = Monday, etc)
        const firstDayOfWeek = startOfYear.getDay();
        // Add empty padding days to align the first week column
        for (let i = 0; i < firstDayOfWeek; i++) {
             days.push({
                 date: null,
                 count: 0,
                 level: -1 // Hidden/empty cell
             });
        }
        
        // Generate every day of the year
        for (let i = 0; i < daysInYear; i++) {
            const d = new Date(startOfYear);
            d.setDate(d.getDate() + i);
            
            // If the date is in the future relative to today, just show an empty (level 0) block
            if (d > today) {
                days.push({
                    date: d,
                    count: 0,
                    level: 0
                });
                continue;
            }
            
            const dateStr = d.toISOString().split('T')[0];
            
            // Count workouts completed on this date
            const workoutsOnDay = logs.filter(l => {
                if (!l.completedAt) return false;
                return l.completedAt.startsWith(dateStr);
            }).length;
            
            days.push({
                date: d,
                count: workoutsOnDay,
                level: workoutsOnDay === 0 ? 0 : workoutsOnDay === 1 ? 1 : workoutsOnDay === 2 ? 2 : 3
            });
        }
        return days;
    };
    
    // Split into chunks (columns of 7 days)
    const consistencyGrid = [];
    const flatData = generateConsistencyData();
    if (flatData.length > 0) {
        const weeks = Math.ceil(flatData.length / 7);
        for (let w = 0; w < weeks; w++) {
            consistencyGrid.push(flatData.slice(w * 7, (w + 1) * 7));
        }
    }
    
    const getHeatmapColor = (level: number) => {
        switch(level) {
            case -1: return 'bg-transparent border border-transparent'; // empty padding
            case 0: return 'bg-zinc-200 dark:bg-white/10';
            case 1: return 'bg-emerald-300 dark:bg-emerald-900/60';
            case 2: return 'bg-emerald-500 dark:bg-emerald-600/80';
            case 3: return 'bg-emerald-600 dark:bg-emerald-400';
            default: return 'bg-zinc-200 dark:bg-white/10';
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin w-10 h-10 text-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">{t('building_dashboard')}</p>
            </div>
        );
    }

    const handleStartWorkout = async () => {
        setIsModalOpen(false); // Close modal before starting
        
        // If we have a planned workout for today, start it directly
        if (plannedForToday) {
            useWorkoutStore.getState().startWorkout(plannedForToday.programId, plannedForToday.dayId, user?.id);
            return;
        }

        // Otherwise generate a new session based on the suggestion
        if (dailySuggestion.length === 0) return;
        
        const id = crypto.randomUUID();
        const newProgram: WorkoutProgram = {
            id,
            userId: user?.id || 'guest',
            title: `Daily ${suggestionMuscle} Focus`,
            description: `A dynamic daily workout targeting your ${suggestionMuscle}.`,
            icon: 'flame',
            colorTheme: 'orange',
            version: 1,
            isPublic: false,
            schedule: [{
                id: crypto.randomUUID(),
                title: 'Main Workout',
                dayOfWeek: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()),
                type: 'strength',
                durationMin: 45,
                slots: dailySuggestion.map((ex) => ({
                    id: crypto.randomUUID(),
                    type: 'normal',
                    entries: [{
                        id: crypto.randomUUID(),
                        exerciseId: crypto.randomUUID(),
                        name: ex.name,
                        targetSets: 3,
                        targetReps: '10-12',
                        imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400"
                    }]
                }))
            }]
        };
        
        LocalService.saveProgram(newProgram);
        navigate(`/program/${id}`);
    };

    const handleSaveToCalendar = async () => {
        if (dailySuggestion.length === 0) return;
        
        // Hide modal
        setIsModalOpen(false);
        
        const programId = crypto.randomUUID();
        const dayId = crypto.randomUUID();
        const newProgram: WorkoutProgram = {
            id: programId,
            userId: user?.id || 'guest',
            title: `Daily ${suggestionMuscle} Focus`,
            description: `A dynamic daily workout targeting your ${suggestionMuscle}.`,
            icon: 'flame',
            colorTheme: 'orange',
            version: 1,
            isPublic: false,
            schedule: [{
                id: dayId,
                title: 'Main Workout',
                dayOfWeek: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()),
                type: 'strength',
                durationMin: 45,
                slots: dailySuggestion.map((ex) => ({
                    id: crypto.randomUUID(),
                    type: 'normal',
                    entries: [{
                        id: crypto.randomUUID(),
                        exerciseId: crypto.randomUUID(),
                        name: ex.name,
                        targetSets: 3,
                        targetReps: '10-12',
                        imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400"
                    }]
                }))
            }]
        };
        
        LocalService.saveProgram(newProgram);
        
        // Add to Today's calendar
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        addPlannedWorkout({
            date: todayKey,
            programId,
            dayId
        });
        
        // Could dispatch a toast here, but user can see it in calendar tab
        showToast('✅ Workout saved to Calendar!');
    };

    if (!user) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-8"
                >
                    <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center glow-primary animate-float">
                        <Play className="w-12 h-12 text-primary ml-1" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black tracking-tightest leading-tight">{t('ignite_journey')}</h2>
                        <p className="text-muted-foreground max-w-sm mx-auto text-xl leading-relaxed font-medium">{t('app_tagline')}</p>
                    </div>
                    <div className="flex flex-col gap-4 max-w-xs mx-auto w-full">
                        <Button className="h-16 text-lg rounded-3xl font-bold shadow-xl shadow-primary/20" onClick={handleGuestMode}>
                            {t('continue_as_guest')}
                        </Button>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-14 rounded-2xl font-bold border-white/10" onClick={() => navigate('/login')}>
                                {t('log_in')}
                            </Button>
                            <Button variant="primary" className="h-14 rounded-2xl font-bold" onClick={() => navigate('/signup')}>
                                {t('sign_up')}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Determine if there is an assigned workout for today
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const plannedForToday = plannedWorkouts.find((w: any) => w.date === todayKey);
    let assignedWorkout = null;
    if (plannedForToday) {
        const assignedProgram = programs.find(p => p.id === plannedForToday.programId);
        const assignedDay = assignedProgram?.schedule?.find(d => d.id === plannedForToday.dayId);
        if (assignedProgram && assignedDay) {
            assignedWorkout = {
                programTitle: assignedProgram.title,
                dayTitle: assignedDay.title
            };
        }
    }

    return (
        <div className="space-y-6 sm:space-y-10 pb-36">
            {/* Hero Section */}
            <header className="flex flex-col gap-1">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 mb-1"
                >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-500">{t('active_session_ready')}</span>
                </motion.div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
                    {t('hello')}, <span className="text-primary italic">{user.name || t('athlete')}</span>
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg font-medium">{t('ready_to_smash')}</p>
            </header>

            {/* Primary CTA */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
            >
                <Button 
                    variant="primary" 
                    className="w-full h-[4.5rem] sm:h-24 rounded-[2rem] sm:rounded-[2.5rem] text-xl sm:text-2xl font-black tracking-tight flex items-center justify-between px-6 sm:px-8 shadow-2xl shadow-primary/30 group overflow-hidden relative"
                    onClick={() => setIsModalOpen(true)}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                    <span className="relative z-10">{t('start_todays_workout')}</span>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    {/* Pulsing effect */}
                    <div className="absolute -inset-1 bg-primary/20 rounded-[2.6rem] blur-xl animate-pulse -z-10" />
                </Button>
            </motion.div>

            {/* Smart Coaching Insights (Holistic Engine) */}
            <section className="mt-2 space-y-6">
                <AICoachDaily />
                <HolisticInsights />
            </section>

            {/* Goal Alignment Widget & Strength Warning */}
            <section className="px-2 space-y-4">
                {biometrics && (
                    <Card className="rounded-[2.5rem] border-white/10 dark:border-white/5 glass p-6 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                                    <Target className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black tracking-tight flex items-center">
                                        Goal Alignment
                                        <PopoverTooltip title="Adaptive Goals">
                                            Your primary goal (Weight Loss, Muscle Gain, etc.) drives the AI's caloric and macronutrient targets. It also shifts the training volume to prioritize either hypertrophy or metabolic conditioning.
                                        </PopoverTooltip>
                                    </h4>
                                    <p className="text-sm text-muted-foreground font-medium capitalize">
                                        Focus: <span className="text-primary font-black tracking-widest uppercase">
                                            {biometrics.primary_fitness_goal?.replace('_', ' ') || 'Maintenance'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                className="rounded-xl border-white/10"
                                onClick={() => setIsGoalModalOpen(true)}
                            >
                                Change Goal
                            </Button>
                        </div>
                    </Card>
                )}

                {showStrengthWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="rounded-3xl border-orange-500/30 bg-orange-500/10 p-5 flex gap-4">
                            <div className="w-12 h-12 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-orange-500 font-bold">Strength Warning</h4>
                                <p className="text-sm text-orange-500/80 font-medium">
                                    Strength is trending downward over your last 3 sessions. Consider increasing protein or reducing your caloric deficit in the Nutrition tab.
                                </p>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </section>

            {/* Recovery Tracking (Serious Mode) */}
            {trainingMode === 'serious' && (
                <section className="px-2 space-y-3">
                    <Card
                        className="rounded-[2.5rem] border-white/10 dark:border-white/5 glass overflow-hidden cursor-pointer hover:border-accent-cyan/50 transition-colors group"
                        onClick={() => navigate('/recovery')}
                    >
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-accent-cyan/10 text-accent-cyan rounded-2xl flex items-center justify-center shrink-0">
                                    <Activity className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black tracking-tight group-hover:text-accent-cyan transition-colors flex items-center">
                                        {t('recovery_status')}
                                        <PopoverTooltip title="Recovery Score">
                                            Aggregated from your sleep quality, muscle soreness, stress levels, and energy. A score below 6/10 will cause the engine to suggest a 'Recovery Day' or reduced intensity.
                                        </PopoverTooltip>
                                    </h4>
                                    <div className="flex gap-3">
                                        <p className="text-sm text-muted-foreground font-medium">
                                            {recentScore ? `${t('recovery_status')}: ${recentScore}/10` : t('log_daily_recovery')}
                                        </p>
                                        {fatigueInfo && (
                                            <p className={cn("text-sm font-bold uppercase", 
                                                fatigueInfo.fatigueLevel === 'Low' ? 'text-emerald-500' :
                                                fatigueInfo.fatigueLevel === 'Medium' ? 'text-amber-500' : 'text-red-500'
                                            )}>
                                                • {fatigueInfo.fatigueLevel} Fatigue
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button variant="secondary" className="rounded-xl pointer-events-none group-hover:bg-accent-cyan/10 group-hover:text-accent-cyan">
                                {t('check_in')}
                            </Button>
                        </div>
                    </Card>

                    {/* Deload Banner */}
                    {fatigueInfo?.isDeloadRecommended && (
                        <Card className="rounded-[2rem] border-red-500/30 bg-red-500/10 overflow-hidden relative group">
                            <div className="p-5 flex gap-4">
                                <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-red-500 font-bold">{t('deload_recommended')}</h4>
                                    <p className="text-sm text-red-500/80 font-medium">{fatigueInfo.reason}</p>
                                    <p className="text-xs text-red-500/60 mt-1">Your next generated workout will have automatically reduced volume & intensity.</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </section>
            )}

            {/* Training Mode Selection */}
            <section className="px-2">
                <Card className="rounded-[2.5rem] border-white/10 dark:border-white/5 glass overflow-hidden relative group">
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                                <Zap className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black tracking-tight flex items-center">
                                    {t('adaptive_engine')}
                                    <PopoverTooltip title="Engine Modes">
                                        <b>Casual:</b> Standard progression without recovery tracking.<br/><br/>
                                        <b>Serious:</b> Full biometric integration. The engine adapts every set based on your fatigue logs.
                                    </PopoverTooltip>
                                </h4>
                                <p className="text-sm text-muted-foreground font-medium capitalize">
                                    {t('current_mode')} <span className="text-primary font-black tracking-widest uppercase">{t(trainingMode === 'casual' ? 'casual' : 'serious')}</span>
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-1.5 glass rounded-[1.25rem] bg-zinc-100/50 dark:bg-zinc-950">
                            <Button 
                                variant={trainingMode === 'casual' ? 'primary' : 'ghost'} 
                                className={cn("rounded-xl font-bold transition-all", trainingMode === 'casual' ? "bg-white text-zinc-900 border border-black/5 shadow-sm dark:bg-zinc-800 dark:text-white dark:shadow-md dark:border-white/10" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5")} 
                                onClick={() => updateTrainingMode('casual')}
                            >
                                {t('casual')}
                            </Button>
                            <Button 
                                variant={trainingMode === 'serious' ? 'primary' : 'ghost'} 
                                className={cn("rounded-xl font-bold transition-all", trainingMode === 'serious' ? "bg-primary text-primary-foreground shadow-md border-transparent" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5")} 
                                onClick={() => updateTrainingMode('serious')}
                            >
                                {t('serious')}
                            </Button>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Up Next / Mini Preview */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                        {t('todays_focus')}
                        <select 
                            value={suggestionMuscle}
                            onChange={(e) => fetchDailySuggestion(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={isFetchingSuggestion}
                            className="bg-white dark:bg-zinc-900 text-primary capitalize outline-none cursor-pointer hover:underline disabled:opacity-50 rounded-md px-1"
                        >
                            {bodyPartsList.map(bp => (
                                <option key={bp} value={bp} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 capitalize">
                                    {bp}
                                </option>
                            ))}
                        </select>
                    </h3>
                    {programs.length > 0 && (
                        <Link to={`/program/${programs[0].id}`} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                            {t('open_active_workout')} <ChevronRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>
                
                {/* Wrap content in a regular div instead of a Link to avoid interaction bugs */}
                <div 
                    className="block transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Card className="glass border-white/10 dark:border-white/5 rounded-[2.5rem] overflow-hidden group">
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                <div>
                                    <h4 className="text-lg font-black tracking-tight group-hover:text-primary transition-colors flex items-center">
                                        {t('daily_suggestion')}
                                        <PopoverTooltip title="Smart Suggestions">
                                            AI-generated workouts based on your lagging muscle groups and current frequency. These are one-off sessions that don't overwrite your main program.
                                        </PopoverTooltip>
                                    </h4>
                                    <PoweredBy />
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline"
                                        className="rounded-xl border-primary/20 text-primary hover:bg-primary/10 z-20 text-sm h-10 px-4"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveToCalendar();
                                        }}
                                    >
                                        {t('save_as_program')}
                                    </Button>
                                    <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                                        <Calendar className="w-5 h-5 text-primary" />
                                    </div>
                                </div>
                            </div>

                            {suggestionError ? (
                                <div className="py-8 text-center bg-destructive/10 dark:bg-destructive/20 rounded-3xl border border-dashed border-destructive/30">
                                    <div className="w-10 h-10 bg-destructive/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Activity className="w-5 h-5 text-destructive" />
                                    </div>
                                    <p className="text-destructive font-medium text-sm">{t('could_not_load')}</p>
                                    <p className="text-muted-foreground text-xs mt-1">{t('try_again_later')}</p>
                                </div>
                            ) : isFetchingSuggestion ? (
                                <div className="py-8 text-center bg-white/5 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-white/20">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                                    <p className="text-muted-foreground text-sm font-medium">{t('fetching_suggestions')}</p>
                                </div>
                            ) : dailySuggestion.length > 0 ? (
                                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                                    {dailySuggestion.map((ex, idx) => (
                                        <ExerciseCard 
                                            key={idx} 
                                            exercise={ex} 
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </Card>
                </div>
            </section>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="glass border-white/10 dark:border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 group">
                    <ProgressRing progress={(workoutsThisWeek / 5) * 100} size={80} strokeWidth={7}>
                        <Zap className="w-5 h-5 text-primary" />
                    </ProgressRing>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('weekly_goal')}</p>
                        <h3 className="text-xl sm:text-2xl font-black tabular-nums">{workoutsThisWeek}<span className="text-sm opacity-40 ml-1">/ 5</span></h3>
                    </div>
                </Card>

                <div className="grid grid-rows-2 gap-3 sm:gap-4">
                    <Card className="glass border-white/10 dark:border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 text-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('streak')}</p>
                            <h3 className="text-lg sm:text-xl font-black tabular-nums">{streak} {t('days')}</h3>
                        </div>
                    </Card>
                    <Card className="glass border-white/10 dark:border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 text-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('volume')}</p>
                            <h3 className="text-lg sm:text-xl font-black tabular-nums">{(weeklyVolume / 1000).toFixed(1)}k <span className="text-xs font-medium opacity-50">kg</span></h3>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Healthy Suggestions */}
            <section className="px-2">
                <Card className={`rounded-[2rem] overflow-hidden ${dailyTip.cardClass} transition-colors duration-500`}>
                    <div className="p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex flex-shrink-0 items-center justify-center ${dailyTip.bgClass}`}>
                            <dailyTip.icon className={`w-6 h-6 ${dailyTip.colorClass}`} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">{dailyTip.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{dailyTip.desc}</p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Body Measurement Tracking */}
            <section className="px-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <Ruler className="w-5 h-5 text-orange-500" />
                        Body Progress
                    </h3>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary font-bold hover:bg-primary/10"
                        onClick={() => setIsMeasurementModalOpen(true)}
                    >
                        Log Stats <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>

                <Card className="rounded-[2.5rem] border-white/10 dark:border-white/5 glass p-6 overflow-hidden">
                    <div className="h-[200px] w-full mt-4">
                        {measurements.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={measurements}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#666" 
                                        fontSize={10} 
                                        tickFormatter={(str) => {
                                            try {
                                                return format(new Date(str), 'MMM d');
                                            } catch {
                                                return str;
                                            }
                                        }} 
                                    />
                                    <YAxis stroke="#666" fontSize={10} domain={['auto', 'auto']} />
                                    <ChartTooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="waist_cm" 
                                        stroke="#f97316" 
                                        strokeWidth={3} 
                                        dot={{ fill: '#f97316' }} 
                                        name="Waist"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="left_bicep_cm" 
                                        stroke="#3b82f6" 
                                        strokeWidth={3} 
                                        dot={{ fill: '#3b82f6' }} 
                                        name="Bicep"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-3xl">
                                <Ruler className="w-8 h-8 text-white/20 mb-3" />
                                <p className="text-muted-foreground text-sm">Need at least 2 data points to show progress</p>
                                <Button 
                                    variant="ghost" 
                                    className="text-primary text-xs mt-2 underline"
                                    onClick={() => setIsMeasurementModalOpen(true)}
                                >
                                    Log your first entry
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </section>

            {/* Consistency Tracker */}
            <Card className="rounded-[2rem] sm:rounded-[2.5rem] border-white/10 dark:border-white/5 glass overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-500" />
                            {t('consistency_tracker')}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                            {t('your_activity', { year: new Date().getFullYear() })}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2 flex-1 flex flex-col min-h-0">
                    <div className="w-full flex-1 min-h-0 overflow-x-auto no-scrollbar pb-2">
                        <div className="h-full min-w-max flex gap-1.5 justify-start">
                            {consistencyGrid.map((col, cIdx) => (
                                <div 
                                    className="flex flex-col gap-1.5 w-3"
                                    key={`col-${cIdx}`}
                                >
                                    {col.map((day, dIdx) => {
                                        if (day.level === -1) {
                                            return <div key={`empty-${cIdx}-${dIdx}`} className="w-full h-full bg-transparent" />;
                                        }
                                        return (
                                            <Tooltip key={`day-${cIdx}-${dIdx}`} content={
                                                <div className="text-xs font-bold px-2 py-1">
                                                    {day.date ? format(day.date, 'MMM d, yyyy') : ''}: {day.count} workout{day.count !== 1 ? 's' : ''}
                                                </div>
                                            }>
                                                <div 
                                                    className={`w-full flex-1 aspect-square rounded-[3px] cursor-help transition-all hover:ring-2 hover:ring-white/40 hover:scale-[1.05] ${getHeatmapColor(day.level)}`}
                                                />
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                        <span>{t('less')}</span>
                        <div className="w-3 h-3 rounded-[3px] bg-zinc-200 dark:bg-white/10" />
                        <div className="w-3 h-3 rounded-[3px] bg-emerald-300 dark:bg-emerald-900/60" />
                        <div className="w-3 h-3 rounded-[3px] bg-emerald-500 dark:bg-emerald-600/80" />
                        <div className="w-3 h-3 rounded-[3px] bg-emerald-600 dark:bg-emerald-400" />
                        <span>{t('more')}</span>
                    </div>
                </CardContent>
            </Card>
        
            <DailyWorkoutModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                exercises={dailySuggestion}
                targetMuscle={suggestionMuscle}
                onStartWorkout={handleStartWorkout}
                onSaveToCalendar={handleSaveToCalendar}
                isLoading={loading || authLoading}
                assignedWorkout={assignedWorkout}
            />

            <MeasurementTracker 
                isOpen={isMeasurementModalOpen}
                onClose={() => setIsMeasurementModalOpen(false)}
                onSuccess={() => {
                    // Refresh measurements
                    if (user) {
                        supabase
                            .from('body_measurements')
                            .select('*')
                            .eq('user_id', user.id)
                            .order('date', { ascending: true })
                            .then(({ data }) => setMeasurements(data || []));
                    }
                }}
            />

            <GoalSelectorModal 
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                currentGoal={biometrics?.primary_fitness_goal}
                userId={user?.id || ''}
                onSuccess={() => {
                    if (user) {
                        getUserBiometrics(user.id).then(bio => setBiometrics(bio));
                    }
                }}
            />
        </div>
    );
};

export default Dashboard;
