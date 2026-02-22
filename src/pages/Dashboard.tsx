import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ProgramService } from '../services/programService';
import type { WorkoutProgram } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
    const { user } = useAuth();
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                if (user) {
                    const data = await ProgramService.getUserPrograms(user.uid);
                    setPrograms(data);
                } else if (isGuest) {
                    // Load from LocalService
                    const { LocalService } = await import('../services/localService');
                    setPrograms(LocalService.getUserPrograms());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user, isGuest]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>;
    }

    if (!user && !isGuest) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-blue-600 ml-1" />
                        </div>
                        <h2 className="text-xl font-bold">Welcome to JUUK Planner</h2>
                        <p className="text-gray-500 max-w-sm mx-auto">Sign in to sync your data across devices, or continue as a guest to start working out immediately.</p>

                        <div className="grid gap-3 max-w-xs mx-auto pt-4">
                            <Button className="w-full" onClick={() => setIsGuest(true)} variant="outline">
                                Continue as Guest
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Programs</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {programs.map((program) => (
                    <Card key={program.id} className="cursor-pointer hover:border-blue-500/50 transition-colors">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center justify-between">
                                {program.title}
                                <span className={`w-3 h-3 rounded-full bg-${program.colorTheme}-500 shadow-sm`} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{program.description}</p>
                            <Button className="w-full" onClick={() => navigate(`/program/${program.id}`)}>
                                View Schedule <Play className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
