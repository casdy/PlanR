/**
 * @file src/pages/CalendarView.tsx
 * @description Workout planning calendar view.
 *
 * Displays an interactive monthly calendar where users can schedule
 * workouts on specific dates. Tapping a date opens a modal to pick a
 * program + day. Planned workouts are stored in `calendarStore` and
 * displayed on the Dashboard when the date arrives.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalendarStore } from '../store/calendarStore';
import { ProgramService } from '../services/programService';
import type { WorkoutProgram } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval,
    isSameDay, 
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Dumbbell, Trash2, X, Play } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuth } from '../hooks/useAuth';

export const CalendarView = () => {
    const { user } = useAuth();
    const { startWorkout, status: workoutStatus } = useWorkoutStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    
    // Zustand store
    const { plannedWorkouts, addPlannedWorkout, removePlannedWorkout } = useCalendarStore();

    useEffect(() => {
        const load = async () => {
            const userId = user?.id || 'guest_user';
            const progs = await ProgramService.getUserPrograms(userId);
            setPrograms(progs.length > 0 ? progs : []);
        };
        load();
    }, [user]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Format for our store: YYYY-MM-DD
    const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setIsAssignModalOpen(true);
    };

    const handleAssign = (programId: string, dayId: string) => {
        if (!selectedDate) return;
        addPlannedWorkout({
            date: formatDateKey(selectedDate),
            programId,
            dayId
        });
        setIsAssignModalOpen(false);
    };

    const handleRemove = () => {
        if (!selectedDate) return;
        removePlannedWorkout(formatDateKey(selectedDate));
        setIsAssignModalOpen(false);
    };

    return (
        <div className="space-y-6 pb-36">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                    <CalendarIcon className="w-8 h-8 text-primary" />
                    Workout <span className="text-primary italic">Calendar</span>
                </h1>
                <p className="text-muted-foreground font-medium">Plan your gains ahead of time.</p>
            </header>

            <Card className="glass border-white/10 dark:border-white/5 rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-2xl hover:bg-primary/20 hover:text-primary">
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h2 className="text-2xl font-black tracking-tight uppercase">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-2xl hover:bg-primary/20 hover:text-primary">
                        <ChevronRight className="w-6 h-6" />
                    </Button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 lg:gap-3">
                    {/* Padding for start of month offsets */}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-16 lg:h-20 rounded-2xl opacity-0" />
                    ))}

                    {/* Actual Days */}
                    {days.map(day => {
                        const dateKey = formatDateKey(day);
                        const isTodayDate = isToday(day);
                        const hasWorkout = plannedWorkouts.find(w => w.date === dateKey);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);

                        return (
                            <motion.div
                                key={day.toString()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    relative h-16 lg:h-20 rounded-2xl border flex items-center justify-center cursor-pointer transition-all duration-300
                                    ${isTodayDate ? 'border-primary/50 bg-primary/10' : 'border-white/10 dark:border-white/5 bg-white/5 dark:bg-slate-900/40 hover:bg-white/10'}
                                    ${isSelected ? 'ring-2 ring-primary border-transparent' : ''}
                                `}
                            >
                                <span className={`text-sm font-bold ${isTodayDate ? 'text-primary' : ''}`}>
                                    {format(day, 'd')}
                                </span>

                                {/* Indicator dot if a workout is planned */}
                                {hasWorkout && (
                                    <div className="absolute bottom-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </Card>

            {/* Assignment Modal / Bottom Sheet */}
            <AnimatePresence>
                {isAssignModalOpen && selectedDate && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-x-0 bottom-0 z-[60] p-4 bg-background/80 backdrop-blur-2xl border-t border-border/50 rounded-t-[3rem] shadow-2xl pb-24"
                    >
                        <div className="max-w-md mx-auto relative">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-0 top-0 rounded-full w-8 h-8 bg-gray-500/20"
                                onClick={() => setIsAssignModalOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            
                            <h3 className="text-xl font-black mb-1">
                                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM do')}
                            </h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-6">Plan your routine</p>

                            {/* Check if already assigned */}
                            {plannedWorkouts.find(w => w.date === formatDateKey(selectedDate)) ? (() => {
                                const planned = plannedWorkouts.find(w => w.date === formatDateKey(selectedDate))!;
                                const assignedProgram = programs.find(p => p.id === planned.programId);
                                const assignedDay = assignedProgram?.schedule?.find(d => d.id === planned.dayId);

                                return (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                                                <Dumbbell className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-base leading-tight">
                                                    {assignedProgram?.title || 'Workout Assigned'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {assignedDay?.title || 'You have a routine scheduled.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="w-full rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10" onClick={handleRemove}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="w-full rounded-2xl gap-2"
                                            disabled={workoutStatus === 'running'}
                                            onClick={() => {
                                                const planned = plannedWorkouts.find(w => w.date === formatDateKey(selectedDate));
                                                if (planned) {
                                                    startWorkout(planned.programId, planned.dayId, user?.id);
                                                    setIsAssignModalOpen(false);
                                                }
                                            }}
                                        >
                                            <Play className="w-4 h-4" />
                                            Start Now
                                        </Button>
                                    </div>
                                </div>
                                );
                            })() : (
                                <div className="space-y-3">
                                    {programs.length === 0 ? (
                                        <p className="text-sm text-center py-4 opacity-60">No saved programs found. Create one first!</p>
                                    ) : (
                                        <div className="max-h-[40vh] overflow-y-auto no-scrollbar space-y-2 pr-2">
                                            {programs.map(prog => (
                                                <div key={prog.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 dark:border-white/5 space-y-3">
                                                    <h4 className="font-bold text-sm">{prog.title}</h4>
                                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                                        {prog.schedule.filter(d => d.type !== 'rest').map(day => (
                                                            <Button 
                                                                key={day.id} 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="flex-shrink-0 text-xs rounded-xl"
                                                                onClick={() => handleAssign(prog.id, day.id)}
                                                            >
                                                                <Plus className="w-3 h-3 mr-1" /> {day.title}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
