import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LocalService } from '../services/localService';
import { useAuth } from '../hooks/useAuth';
import type { WorkoutLog } from '../types';
import { ChevronLeft, ChevronRight, Activity, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const History = () => {
    const { user } = useAuth();
    const [logs, setLogs] = React.useState<WorkoutLog[]>([]);
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());

    React.useEffect(() => {
        const userId = user?.id || 'guest';
        const fetchedLogs = LocalService.getLogs(userId);
        setLogs(fetchedLogs);
    }, [user]);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const workoutDays = React.useMemo(() => {
        const set = new Set();
        logs.forEach(log => {
            const date = new Date(log.completedAt).toDateString();
            set.add(date);
        });
        return set;
    }, [logs]);

    const dailyLogs = React.useMemo(() => {
        if (!selectedDate) return [];
        const selectedStr = selectedDate.toDateString();
        return logs.filter(log => new Date(log.completedAt).toDateString() === selectedStr);
    }, [logs, selectedDate]);

    return (
        <div className="space-y-8 pb-24">
            <header>
                <h1 className="text-4xl font-black tracking-tighter">Activity</h1>
                <p className="text-muted-foreground font-medium">Your fitness journey in a glance</p>
            </header>

            <Card className="glass border-white/10 dark:border-white/5 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        {monthYear}
                    </CardTitle>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl h-8 w-8 hover:bg-white/10">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl h-8 w-8 hover:bg-white/10">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-6">
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <span key={i} className="text-[10px] font-black text-muted-foreground opacity-50">{d}</span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const dateStr = d.toDateString();
                            const hasWorkout = workoutDays.has(dateStr);
                            const isToday = dateStr === new Date().toDateString();
                            const isSelected = selectedDate?.toDateString() === dateStr;

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(d)}
                                    className={cn(
                                        "aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300",
                                        isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10" : "hover:bg-white/5",
                                        isToday && !isSelected && "ring-2 ring-primary/30"
                                    )}
                                >
                                    <span className={cn("text-xs font-bold", isSelected ? "font-black" : "")}>{day}</span>
                                    {hasWorkout && !isSelected && (
                                        <div className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-2">
                    {selectedDate?.toLocaleDateString('default', { day: 'numeric', month: 'long' }) || 'Selected Day'}
                </h3>
                
                <AnimatePresence mode="wait">
                    {dailyLogs.length > 0 ? (
                        <div className="space-y-3">
                            {dailyLogs.map((log, idx) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="glass border-white/5 rounded-3xl overflow-hidden group hover:border-primary/20 transition-all">
                                        <div className="p-5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <Activity className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold">Strength Session</h4>
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                        {(log as any).programTitle || 'Workout Program'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black italic">{(log.totalTimeSpentSec / 60).toFixed(0)}m</p>
                                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest">DURATION</p>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-12 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10"
                        >
                            <p className="text-muted-foreground font-medium">No activity recorded for this day.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
