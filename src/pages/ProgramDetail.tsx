import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProgramService } from '../services/programService';
import type { WorkoutProgram } from '../types';
import { useWorkoutStore } from '../store/workoutStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChevronLeft, Play, Clock, Dumbbell } from 'lucide-react';
import { cn } from '../lib/utils'; // Keeping this one, assuming previous fixes worked

export const ProgramDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { startWorkout, status } = useWorkoutStore();
    const [program, setProgram] = useState<WorkoutProgram | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchProgram = async () => {
                if (user) {
                    const progs = await ProgramService.getUserPrograms(user.uid);
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
        startWorkout(program.id, dayId);
        // The overlay will appear automatically
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        {program.title}
                    </h1>
                    <p className="text-gray-500 mt-1">{program.description}</p>
                </div>
            </div>

            <div className="space-y-4">
                {program.schedule.map((day) => {
                    const isRest = day.type === 'rest' || day.type === 'active_recovery';
                    return (
                        <Card key={day.id} className={cn("overflow-hidden transition-all hover:shadow-md", isRest && "opacity-75 bg-gray-50 dark:bg-slate-900 border-dashed")}>
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                        isRest ? "bg-gray-200 text-gray-500 dark:bg-gray-800" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                    )}>
                                        {isRest ? <Clock className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{day.title}</h3>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            {day.dayOfWeek} • {day.durationMin} min • {day.type}
                                        </p>
                                    </div>
                                </div>

                                {!isRest && (
                                    <Button
                                        size="icon"
                                        className="rounded-full shadow-lg"
                                        onClick={() => handleStartWorkout(day.id)}
                                        disabled={status === 'running'} // Disable starting another if one is running? Or specific logic
                                    >
                                        <Play className="w-5 h-5 fill-white ml-1" />
                                    </Button>
                                )}
                            </div>

                            {!isRest && (
                                <div className="px-5 pb-5 pt-0">
                                    <div className="space-y-1 mt-2 pl-16">
                                        {day.exercises.slice(0, 3).map((ex, i) => ( // Show first 3 only for preview
                                            <p key={i} className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                • {ex.name} <span className="text-gray-400 text-xs">({ex.targetSets}x{ex.targetReps})</span>
                                            </p>
                                        ))}
                                        {day.exercises.length > 3 && (
                                            <p className="text-xs text-blue-500 font-medium pl-2 pt-1">
                                                + {day.exercises.length - 3} more exercises
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
