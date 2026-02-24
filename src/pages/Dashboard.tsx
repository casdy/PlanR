import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ProgramService } from '../services/programService';
import { LocalService } from '../services/localService';
import type { WorkoutProgram, WorkoutDay } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, Play, Activity, Flame, TrendingUp, ArrowRight, Calendar, Zap, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ProgressRing } from '../components/ui/ProgressRing';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard = () => {
    const { user, continueAsGuest } = useAuth();
    const navigate = useNavigate();
    
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(0);
    const [weeklyVolume, setWeeklyVolume] = useState(0);
    const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);

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
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    const todayRoutine = useMemo(() => {
        if (programs.length === 0) return null;
        const activeProg = programs[0]; // Assuming first program is active for now
        const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
        return activeProg.schedule.find(d => d.dayOfWeek === dayOfWeek) as WorkoutDay | undefined;
    }, [programs]);

    const weeklyData = [
        { day: 'Mon', volume: 12400 },
        { day: 'Tue', volume: 15600 },
        { day: 'Wed', volume: 8200 },
        { day: 'Thu', volume: 19800 },
        { day: 'Fri', volume: 14200 },
        { day: 'Sat', volume: 21000 },
        { day: 'Sun', volume: weeklyVolume || 5000 },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin w-10 h-10 text-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Building your dashboard...</p>
            </div>
        );
    }

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

    return (
        <div className="space-y-10 pb-20">
            {/* Hero Section */}
            <header className="flex flex-col gap-2">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 mb-2"
                >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-500">Active Session Ready</span>
                </motion.div>
                <h1 className="text-4xl font-black tracking-tighter">
                    Hello, <span className="text-primary italic">{user.name || 'Athlete'}</span>
                </h1>
                <p className="text-muted-foreground text-lg font-medium">Ready to smash today's goals?</p>
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
                    className="w-full h-24 rounded-[2.5rem] text-2xl font-black tracking-tight flex items-center justify-between px-8 shadow-2xl shadow-primary/30 group overflow-hidden relative"
                    onClick={() => todayRoutine ? navigate(`/program/${programs[0].id}`) : navigate('/manage')}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                    <span className="relative z-10">Start Today's Workout</span>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-6 h-6" />
                    </div>
                    {/* Pulsing effect */}
                    <div className="absolute -inset-1 bg-primary/20 rounded-[2.6rem] blur-xl animate-pulse -z-10" />
                </Button>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="glass border-white/10 dark:border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-4 group">
                    <ProgressRing progress={workoutsThisWeek / 5} size={100} strokeWidth={8}>
                        <Zap className="w-6 h-6 text-primary" />
                    </ProgressRing>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Weekly Goal</p>
                        <h3 className="text-2xl font-black tabular-nums">{workoutsThisWeek}<span className="text-sm opacity-40 ml-1">/ 5</span></h3>
                    </div>
                </Card>

                <div className="grid grid-rows-2 gap-4">
                    <Card className="glass border-white/10 dark:border-white/5 rounded-3xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center">
                            <Flame className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Streak</p>
                            <h3 className="text-xl font-black tabular-nums">{streak} Days</h3>
                        </div>
                    </Card>
                    <Card className="glass border-white/10 dark:border-white/5 rounded-3xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume</p>
                            <h3 className="text-xl font-black tabular-nums">{(weeklyVolume / 1000).toFixed(1)}k <span className="text-xs font-medium opacity-50">kg</span></h3>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Up Next / Mini Preview */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black tracking-tight">Today's Focus</h3>
                    <Link to="/history" className="text-xs font-bold text-primary flex items-center gap-1">
                        Full Schedule <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                
                <Card className="glass border-white/10 dark:border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h4 className="text-lg font-black tracking-tight">{todayRoutine?.title || 'Rest Day'}</h4>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{todayRoutine?.durationMin || 0} Minutes • {todayRoutine?.exercises.length || 0} Exercises</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                        </div>

                        {todayRoutine && todayRoutine.exercises.length > 0 ? (
                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                                {todayRoutine.exercises.map((ex, idx) => (
                                    <div 
                                        key={ex.id}
                                        className="flex-shrink-0 min-w-[140px] bg-white/5 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/10 dark:border-white/5"
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Ex {idx + 1}</p>
                                        <p className="text-sm font-bold truncate leading-tight mb-2">{ex.name}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60">
                                            <span className="bg-white/5 px-2 py-0.5 rounded-full">{ex.targetSets} Sets</span>
                                            <span className="bg-white/5 px-2 py-0.5 rounded-full">{ex.targetReps} Reps</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-white/5 dark:bg-slate-900/40 rounded-3xl border border-dashed border-white/20">
                                <p className="text-muted-foreground font-medium">Enjoy your recovery!</p>
                            </div>
                        )}
                    </div>
                </Card>
            </section>

            {/* Volume Chart */}
            <Card className="rounded-[2.5rem] border-white/10 dark:border-white/5 glass overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Performance Graph
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] w-full pr-4">
                    <ResponsiveContainer width="100%" height={250} minWidth={0}>
                        <AreaChart data={weeklyData}>
                            <defs>
                                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                            <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} 
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--card))', 
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '1rem',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="volume" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorVolume)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
