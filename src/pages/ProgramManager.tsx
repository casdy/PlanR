import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { RoutineGenerator } from '../components/RoutineGenerator';
import { ProgramService } from '../services/programService';
import { LocalService } from '../services/localService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { WorkoutProgram } from '../types';
import { Dumbbell, ChevronRight, Flame, Home, Clock, Plus } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
    flame: <Flame className="w-6 h-6" />,
    home: <Home className="w-6 h-6" />,
    dumbbell: <Dumbbell className="w-6 h-6" />,
};

const colorMap: Record<string, string> = {
    orange: 'bg-orange-500/10 text-orange-500',
    blue: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-500',
};

export const ProgramManager = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPrograms = async () => {
        setLoading(true);
        try {
            const userId = user?.id || 'guest';
            const progs = await ProgramService.getUserPrograms(userId);
            setPrograms(progs);
        } catch (err) {
            console.error('Failed to load programs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrograms();
    }, [user]);

    const handleRoutineGenerated = async (newProgram: any) => {
        const id = crypto.randomUUID();
        const programToSave = {
            ...newProgram,
            id,
            userId: user?.id || 'guest',
            version: 1
        };
        LocalService.saveProgram(programToSave);
        await ProgramService.saveProgram(programToSave);
        navigate(`/program/${id}`);
    };

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                    <Dumbbell className="w-8 h-8 text-primary" />
                    My <span className="text-primary italic">Programs</span>
                </h1>
                <p className="text-muted-foreground font-medium">Build and manage your saved workout routines.</p>
            </header>

            {/* AI Generator */}
            <RoutineGenerator onRoutineGenerated={handleRoutineGenerated} />

            {/* Saved Programs */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-black tracking-tight">Saved Programs</h2>
                    {programs.length > 0 && (
                        <span className="text-xs font-bold text-muted-foreground">{programs.length} total</span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="h-24 rounded-[2rem] bg-secondary/30 animate-pulse" />
                        ))}
                    </div>
                ) : programs.length === 0 ? (
                    <Card className="p-8 rounded-[2rem] border-dashed border-white/10 text-center space-y-3">
                        <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
                            <Plus className="w-7 h-7 text-primary" />
                        </div>
                        <p className="font-bold">No programs yet</p>
                        <p className="text-sm text-muted-foreground">Use the AI Architect above to generate your first routine!</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {programs.map((prog, i) => {
                            const color = colorMap[prog.colorTheme || 'blue'] || colorMap.blue;
                            const workoutDays = prog.schedule.filter(d => d.type !== 'rest');
                            return (
                                <motion.div
                                    key={prog.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card
                                        className="p-5 rounded-[2rem] border-white/10 dark:border-white/5 glass cursor-pointer hover:border-primary/30 transition-colors group"
                                        onClick={() => navigate(`/program/${prog.id}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                                                {iconMap[prog.icon || 'dumbbell'] || <Dumbbell className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-base truncate group-hover:text-primary transition-colors">{prog.title}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {workoutDays.length} Workout Days
                                                    </span>
                                                    {workoutDays[0]?.durationMin && (
                                                        <span className="text-xs font-bold text-muted-foreground">
                                                            {workoutDays[0].durationMin} min
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};
