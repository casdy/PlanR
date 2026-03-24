import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Sparkles, ArrowRight, Quote, CheckCircle2, Loader2, Zap, Beef } from 'lucide-react';
import { LocalService } from '../services/localService';
import { useAuth } from '../hooks/useAuth';
import { useSettingsStore } from '../store/settingsStore';
import { getUserBiometrics } from '../engine/calorieEngine';
import { cn } from '../lib/utils';

export const AICoachDaily: React.FC = () => {
    const { user } = useAuth();
    const { primaryFitnessGoal } = useSettingsStore();
    const [stats, setStats] = useState<any>(null);
    const [plan, setPlan] = useState<any[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [biometrics, setBiometrics] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const load = async () => {
            // Track open and get stats
            LocalService.trackAppOpen();
            const engagement = LocalService.getDailyEngagement(user?.id);
            setStats(engagement);

            // Load biometrics for dynamic footer
            if (user?.id) {
                const bio = await getUserBiometrics(user.id);
                setBiometrics(bio);
            }

            // Load 7-day plan
            const storedPlan = localStorage.getItem('planR_coaching_plan');
            if (storedPlan) {
                setPlan(JSON.parse(storedPlan));
            }

            // Logic for visibility
            const hour = new Date().getHours();
            const { openCount, workedOutToday } = engagement;
            const forceShow = localStorage.getItem('dev_force_ai_coach') === 'true';

            let visible = false;

            if (forceShow || workedOutToday) {
                visible = true; 
            } else if (openCount <= 2) {
                visible = true; 
            } else if (hour >= 11 && openCount <= 4) {
                 visible = true; 
            } else if (hour >= 20) {
                visible = true; 
            }

            setIsVisible(visible);
        };

        load();

        window.addEventListener('storage', (e) => {
            if (e.key === 'planR_coaching_plan' || e.key === 'planr-notification-settings') {
                load();
            }
        });

        const interval = setInterval(load, 5000); // 5s is enough

        return () => {
            window.removeEventListener('storage', load);
            clearInterval(interval);
        };
    }, [user, primaryFitnessGoal]);

    const isPraise = stats?.workedOutToday;

    if (!isVisible) return null;

    if (plan.length === 0) {
        return (
            <div className="px-2">
                <Card className="rounded-[2.5rem] border-white/5 glass p-6 min-h-[160px] flex flex-col justify-center items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest text-center">
                        AI Coach is preparing your plan...
                        <span className="block mt-2 text-[8px] opacity-50 lowercase font-normal italic">
                            (If this takes too long, ensure your local API server is running at :3000)
                        </span>
                    </p>
                </Card>
            </div>
        );
    }

    const ts = parseInt(localStorage.getItem('planR_coaching_plan_ts') || Date.now().toString());
    const daysSinceStart = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
    const dayIndex = daysSinceStart % 7;
    const todayPlan = plan[dayIndex] || plan[0];
    const message = isPraise ? todayPlan.praise_message : todayPlan.motivation_message;

    const bmi = biometrics ? (biometrics.weight_kg / Math.pow(biometrics.height_cm / 100, 2)).toFixed(1) : '24.5';
    const goalTitle = primaryFitnessGoal.replace('_', ' ');

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="px-2"
            >
                <Card className={cn(
                    "rounded-[2.5rem] border-white/10 dark:border-white/5 overflow-hidden relative group transition-all duration-500",
                    isPraise ? "bg-emerald-500/10 border-emerald-500/20" : "glass"
                )}>
                    <div className={cn(
                        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20 transition-colors",
                        isPraise ? "bg-emerald-500" : "bg-primary"
                    )} />

                    <div className="p-6 relative z-10">
                        <header className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                                    isPraise ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/20 text-primary"
                                )}>
                                    {isPraise ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black tracking-tight flex items-center gap-1.5 uppercase">
                                        Coach AI
                                        <Badge variant={isPraise ? 'accent' : 'ai'} className="scale-75 origin-left">
                                            {isPraise ? 'Achievement' : 'Insight'}
                                        </Badge>
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                                        Session Day {todayPlan.day}
                                    </p>
                                </div>
                            </div>
                            <div className="text-[10px] font-black opacity-20 group-hover:opacity-40 transition-opacity">
                                <Quote className="w-6 h-6 rotate-180" />
                            </div>
                        </header>

                        <div className="space-y-4">
                            <motion.p 
                                key={message}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl sm:text-2xl font-black tracking-tight leading-tight"
                            >
                                {message}
                            </motion.p>

                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10">
                                    Focus: {todayPlan.workout_focus}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10">
                                    Fuel: {todayPlan.nutrition_focus}
                                </Badge>
                                {isPraise && (
                                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/20 border-emerald-500/20 text-emerald-500">
                                        Check-in Complete
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Expandable Deep Insights Section */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-2">
                                            <div className="flex items-center gap-2 text-primary">
                                                <Zap className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Performance Strategy</span>
                                            </div>
                                            <p className="text-xs font-semibold text-foreground/80 leading-relaxed">
                                                Based on your {goalTitle} goal, we're optimizing for {primaryFitnessGoal === 'fat_loss' ? 'metabolic density' : 'structural hypertrophy'}. 
                                                Ensure controlled eccentrics on all compound lifts.
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-2">
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <Beef className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Nutritional Logic</span>
                                            </div>
                                            <p className="text-xs font-semibold text-foreground/80 leading-relaxed">
                                                Your current BMI of {bmi} suggests a {parseFloat(bmi) > 25 ? 'caloric control' : 'steady maintenance'} approach. 
                                                Priority: 0.8g protein per lb of bodyweight.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground font-medium italic">
                                Generated for your BMI of {bmi} and {goalTitle} goal.
                            </p>
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={cn(
                                    "p-2 rounded-xl transition-all duration-300",
                                    isExpanded ? "bg-primary text-primary-foreground rotate-90" : "text-primary hover:bg-primary/10"
                                )}
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
};
