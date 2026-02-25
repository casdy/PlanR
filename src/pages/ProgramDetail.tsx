/**
 * @file src/pages/ProgramDetail.tsx
 * @description Detailed view of a single workout program.
 *
 * Renders the full schedule of a selected program and lets the user
 * start a workout for any specific day. Also includes controls to edit
 * (via ProgramEditor) or delete the program.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProgramService } from '../services/programService';
import type { WorkoutProgram } from '../types';
import { useWorkoutStore } from '../store/workoutStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChevronLeft, Play, Clock, Dumbbell, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { WorkoutDayView } from '../components/WorkoutDayView';
import { ProgramEditor } from '../components/ProgramEditor';

export const ProgramDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { startWorkout, status } = useWorkoutStore();
    const [program, setProgram] = useState<WorkoutProgram | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (id) {
            const fetchProgram = async () => {
                if (user) {
                    const progs = await ProgramService.getUserPrograms(user.id);
                    setProgram(progs.find(p => p.id === id) || null);
                } else {
                    // Guest Mode
                    const { LocalService } = await import('../services/localService');
                    setProgram(LocalService.getProgramById(id) || null);
                }
                setLoading(false);
            };
            fetchProgram();
        }
    }, [user, id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading program...</div>;
    if (!program) return <div className="p-8 text-center text-red-500">Program not found</div>;

    const handleStartWorkout = (dayId: string) => {
        if (!program) return;
        startWorkout(program.id, dayId, user?.id);
        // The overlay will appear automatically
    };

    return (
        <div className="space-y-10 pb-32">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-2xl bg-secondary/50">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
            </div>

            <header className="space-y-4 relative">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-5xl font-black tracking-tightest leading-tight pr-12"
                >
                    {program.title.split(' ').map((word, i) => (
                        <span key={i} className={i % 2 === 0 ? "text-foreground" : "text-primary italic"}>{word} </span>
                    ))}
                </motion.h1>
                <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-xl">{program.description}</p>
                
                <div className="flex justify-between items-center pt-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/50 border border-border/40 text-sm font-bold">
                            <Clock className="w-4 h-4 text-primary" />
                            {program.schedule.length} Days / Week
                        </div>
                    </div>
                </div>

                <Button 
                    variant={isEditing ? 'primary' : 'outline'}
                    size="icon" 
                    className={cn(
                        "absolute right-0 top-0 w-12 h-12 rounded-full shadow-lg transition-transform",
                        isEditing ? "rotate-12" : ""
                    )}
                    onClick={() => setIsEditing(!isEditing)}
                >
                    <Edit2 className="w-5 h-5" />
                </Button>
            </header>

            {isEditing ? (
                <div className="pt-6 border-t border-white/10">
                    <div className="mb-6">
                        <h2 className="text-2xl font-black">Edit Routine</h2>
                        <p className="text-muted-foreground text-sm">Swap exercises seamlessly via API Ninjas.</p>
                    </div>
                    <ProgramEditor program={program} onUpdate={(p) => setProgram(p)} />
                </div>
            ) : (
                <div className="space-y-6">
                    {program.schedule.map((day, i) => {
                        const isRest = day.type === 'rest' || day.type === 'active_recovery';
                        return (
                            <motion.div
                                key={day.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className={cn(
                                    "overflow-hidden transition-all duration-500 border-border/40 hover:border-primary/30 rounded-[2.5rem] bg-card/30 backdrop-blur-sm group",
                                    isRest && "opacity-50 border-dashed"
                                )}>
                                    <div className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                                isRest ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary glow-primary"
                                            )}>
                                                {isRest ? <Clock className="w-8 h-8" /> : <Dumbbell className="w-8 h-8" />}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl tracking-tight">{day.title}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{day.dayOfWeek}</span>
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{day.durationMin} MIN • {day.type.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {!isRest && (
                                            <Button
                                                size="icon"
                                                className="w-14 h-14 rounded-full shadow-2xl glow-primary z-10"
                                                onClick={() => handleStartWorkout(day.id)}
                                                disabled={status === 'running'}
                                            >
                                                <Play className="w-6 h-6 fill-primary-foreground ml-1" />
                                            </Button>
                                        )}
                                    </div>

                                    {(!isRest && day.exercises.length > 0) && (
                                        <div className="px-6 pb-8 pt-2">
                                            <div className="ml-20 border-t border-border/20 pt-4">
                                                <WorkoutDayView day={day} programTitle={program.title} />
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
