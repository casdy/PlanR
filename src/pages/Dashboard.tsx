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
import { ProgramService } from '../services/programService';
import { LocalService } from '../services/localService';
import { getExercisesByBodyPart } from '../services/exerciseDBService';
import type { ExerciseDBItem } from '../services/exerciseDBService';
import type { WorkoutProgram } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, Play, Activity, Flame, TrendingUp, ArrowRight, Calendar, Zap, ChevronRight, Droplets } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ProgressRing } from '../components/ui/ProgressRing';
import { ExerciseCard } from '../components/ExerciseCard';
import { DailyWorkoutModal } from '../components/DailyWorkoutModal';
import { useCalendarStore } from '../store/calendarStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useToastStore } from '../store/toastStore';
import { format } from 'date-fns';

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

export const Dashboard = () => {
    const { user, continueAsGuest, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(0);
    const [weeklyVolume, setWeeklyVolume] = useState(0);
    const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
    const [dailySuggestion, setDailySuggestion] = useState<ExerciseDBItem[]>([]);
    const [suggestionMuscle, setSuggestionMuscle] = useState<string>('chest');
    const [suggestionError, setSuggestionError] = useState(false);
    const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        async function load() {
            try {
                if (user) {
                    const userId = user.id; // Use user.id consistently
                    const [progs, s, vol] = await Promise.all([
                        ProgramService.getUserPrograms(userId),
                        LocalService.getCurrentStreak(userId),
                        LocalService.getWeeklyVolume(userId)
                    ]);
                    setPrograms(progs);
                    setStreak(s);
                    setWeeklyVolume(vol);
                    
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
            title: "Hydration Check",
            desc: "Aim for 3 liters of water today to maximize muscle recovery and performance.",
            icon: Droplets,
            colorClass: "text-blue-500",
            bgClass: "bg-blue-500/20",
            cardClass: "border-blue-500/20 bg-blue-500/5 dark:bg-blue-900/10"
        },
        {
            title: "Protein Power",
            desc: "Consume 1.6-2.2g of protein per kg of body weight for optimal muscle synthesis.",
            icon: Flame,
            colorClass: "text-orange-500",
            bgClass: "bg-orange-500/20",
            cardClass: "border-orange-500/20 bg-orange-500/5 dark:bg-orange-900/10"
        },
        {
            title: "Sleep & Recovery",
            desc: "Get 7-9 hours of quality sleep tonight. Muscles grow while you rest, not while you train.",
            icon: Zap,
            colorClass: "text-purple-500",
            bgClass: "bg-purple-500/20",
            cardClass: "border-purple-500/20 bg-purple-500/5 dark:bg-purple-900/10"
        },
        {
            title: "Stay Active",
            desc: "Take a 10-minute walk after your meals to improve digestion and regulate blood sugar.",
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
                <p className="text-muted-foreground font-medium animate-pulse">Building your dashboard...</p>
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
            description: `A dynamic daily workout targeting your ${suggestionMuscle}, generated by ExerciseDB.`,
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
                exercises: dailySuggestion.map((ex) => ({
                    id: crypto.randomUUID(),
                    name: ex.name,
                    targetSets: 3,
                    targetReps: '10-12'
                }))
            }]
        };
        
        const { LocalService } = await import('../services/localService');
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
            description: `A dynamic daily workout targeting your ${suggestionMuscle}, generated by ExerciseDB.`,
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
                exercises: dailySuggestion.map((ex) => ({
                    id: crypto.randomUUID(),
                    name: ex.name,
                    targetSets: 3,
                    targetReps: '10-12'
                }))
            }]
        };
        
        const { LocalService } = await import('../services/localService');
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
                        <h2 className="text-5xl font-black tracking-tightest leading-tight">Ignite Your <span className="text-primary italic">Journey.</span></h2>
                        <p className="text-muted-foreground max-w-sm mx-auto text-xl leading-relaxed font-medium">The ultimate companion for your fitness routine. Fast, simple, and beautifully powerful.</p>
                    </div>
                    <div className="flex flex-col gap-4 max-w-xs mx-auto w-full">
                        <Button className="h-16 text-lg rounded-3xl font-bold shadow-xl shadow-primary/20" onClick={handleGuestMode}>
                            Continue as Guest
                        </Button>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-14 rounded-2xl font-bold border-white/10" onClick={() => navigate('/login')}>
                                Log In
                            </Button>
                            <Button variant="primary" className="h-14 rounded-2xl font-bold" onClick={() => navigate('/signup')}>
                                Sign Up
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
                    <span className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-500">Active Session Ready</span>
                </motion.div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
                    Hello, <span className="text-primary italic">{user.name || 'Athlete'}</span>
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg font-medium">Ready to smash today's goals?</p>
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
                    <span className="relative z-10">Start Today's Workout</span>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    {/* Pulsing effect */}
                    <div className="absolute -inset-1 bg-primary/20 rounded-[2.6rem] blur-xl animate-pulse -z-10" />
                </Button>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="glass border-white/10 dark:border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 group">
                    <ProgressRing progress={workoutsThisWeek / 5} size={80} strokeWidth={7}>
                        <Zap className="w-5 h-5 text-primary" />
                    </ProgressRing>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Weekly Goal</p>
                        <h3 className="text-xl sm:text-2xl font-black tabular-nums">{workoutsThisWeek}<span className="text-sm opacity-40 ml-1">/ 5</span></h3>
                    </div>
                </Card>

                <div className="grid grid-rows-2 gap-3 sm:gap-4">
                    <Card className="glass border-white/10 dark:border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 text-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Streak</p>
                            <h3 className="text-lg sm:text-xl font-black tabular-nums">{streak} Days</h3>
                        </div>
                    </Card>
                    <Card className="glass border-white/10 dark:border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 text-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume</p>
                            <h3 className="text-lg sm:text-xl font-black tabular-nums">{(weeklyVolume / 1000).toFixed(1)}k <span className="text-xs font-medium opacity-50">kg</span></h3>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Up Next / Mini Preview */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                        Today's Focus:
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
                            Open Active Workout <ChevronRight className="w-3 h-3" />
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
                                    <h4 className="text-lg font-black tracking-tight group-hover:text-primary transition-colors">Daily Suggestion</h4>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Powered by ExerciseDB</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl border-primary/20 text-primary hover:bg-primary/10 z-20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveToCalendar();
                                        }}
                                    >
                                        Save as Program
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
                                    <p className="text-destructive font-medium text-sm">Could not load suggestions.</p>
                                    <p className="text-muted-foreground text-xs mt-1">Please try again later.</p>
                                </div>
                            ) : isFetchingSuggestion ? (
                                <div className="py-8 text-center bg-white/5 dark:bg-slate-900/40 rounded-3xl border border-dashed border-white/20">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                                    <p className="text-muted-foreground text-sm font-medium">Fetching expert suggestions...</p>
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

            {/* Consistency Tracker */}
            <Card className="rounded-[2rem] sm:rounded-[2.5rem] border-white/10 dark:border-white/5 glass overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-500" />
                            Consistency Tracker
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                            Your {new Date().getFullYear()} Activity
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
                        <span>Less</span>
                        <div className="w-3 h-3 rounded-[3px] bg-zinc-200 dark:bg-white/10" />
                        <div className="w-3 h-3 rounded-[3px] bg-emerald-300 dark:bg-emerald-900/60" />
                        <div className="w-3 h-3 rounded-[3px] bg-emerald-500 dark:bg-emerald-600/80" />
                        <div className="w-3 h-3 rounded-[3px] bg-emerald-600 dark:bg-emerald-400" />
                        <span>More</span>
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
        </div>
    );
};

export default Dashboard;
