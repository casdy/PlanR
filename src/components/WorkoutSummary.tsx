import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkoutStore } from '../store/workoutStore';
import { hfService } from '../services/hfService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Trophy, Share2, RotateCcw, Loader2, Download, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LocalService } from '../services/localService';

const Shimmer = () => (
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] skew-x-12" />
);

export const WorkoutSummary = ({ onRestart }: { onRestart: () => void }) => {
    const { status, badgePrompt, lastBadgeUrl, setBadgeUrl, cancelWorkout } = useWorkoutStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const [isLogging, setIsLogging] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const finalizeWorkout = async () => {
            if (status === 'finished' && !isLogging) {
                setIsLogging(true);
                try {
                    const userId = user?.id || 'guest';
                    // Log the workout to SQLite
                    const { activeProgramId, activeDayId, elapsedSeconds } = useWorkoutStore.getState();
                    if (activeProgramId && activeDayId) {
                        await LocalService.logWorkout({
                            programId: activeProgramId,
                            dayId: activeDayId,
                            totalTimeSpentSec: elapsedSeconds,
                            userId: userId,
                            completedExerciseIds: [], // Could be expanded later
                            date: new Date().toISOString()
                        }, userId);
                    }
                } catch (err) {
                    console.error("Workout logging failed:", err);
                }
            }
        };

        const generateMyBadge = async () => {
            if (status === 'finished' && badgePrompt && !lastBadgeUrl && !isGenerating) {
                setIsGenerating(true);
                try {
                    const blob = await hfService.generateBadge(badgePrompt) as unknown as Blob;
                    const url = URL.createObjectURL(blob);
                    setBadgeUrl(url);
                } catch (err) {
                    console.error("Badge generation failed:", err);
                } finally {
                    setIsGenerating(false);
                }
            }
        };

        finalizeWorkout();
        generateMyBadge();
    }, [status, badgePrompt, lastBadgeUrl, setBadgeUrl, isGenerating, isLogging, user]);

    if (status !== 'finished') return null;

    const handleDownload = () => {
        if (!lastBadgeUrl) return;
        const link = document.createElement('a');
        link.href = lastBadgeUrl;
        link.download = 'PlanR-Achievement-Badge.png';
        link.click();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="overflow-hidden border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-white dark:bg-slate-900 rounded-[2.5rem]">
                    <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-8 text-center text-white relative overflow-hidden">
                        <motion.div 
                             animate={{ rotate: [0, 10, -10, 0] }}
                             transition={{ repeat: Infinity, duration: 5 }}
                             className="relative z-10"
                        >
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]" />
                        </motion.div>
                        <h2 className="text-3xl font-black mb-1 relative z-10">BEAST MODE</h2>
                        <p className="text-blue-100 opacity-80 uppercase tracking-[0.2em] text-[10px] font-black relative z-10">New Achievement Unlocked</p>
                        
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                    </div>

                    <div className="p-8 text-center">
                        <div className="relative w-full aspect-square mb-8 bg-slate-100 dark:bg-slate-950 rounded-[2rem] overflow-hidden flex items-center justify-center border-4 border-slate-50 dark:border-slate-800/50 shadow-inner">
                            {lastBadgeUrl ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full h-full"
                                >
                                    <img 
                                        src={lastBadgeUrl} 
                                        alt="Achievement Badge" 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-4 right-4 animate-bounce">
                                        <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-full shadow-lg backdrop-blur-sm">
                                            <Sparkles className="w-4 h-4 text-yellow-500" />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 relative w-full h-full justify-center">
                                    <Shimmer />
                                    <div className="relative">
                                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                                        <div className="absolute inset-0 blur-xl bg-indigo-500/30 animate-pulse" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest animate-pulse">
                                        Forging Achievement...
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <Button variant="secondary" className="gap-2 h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-none text-xs font-bold uppercase tracking-wider" onClick={handleDownload} disabled={!lastBadgeUrl}>
                                <Download className="w-4 h-4" />
                                Save
                            </Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-14 rounded-2xl shadow-lg shadow-indigo-600/20 text-xs font-bold uppercase tracking-wider">
                                <Share2 className="w-4 h-4" />
                                Share
                            </Button>
                        </div>

                        <Button 
                            variant="ghost" 
                            className="w-full h-12 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 gap-2 font-bold"
                            onClick={() => {
                                cancelWorkout();
                                onRestart();
                            }}
                        >
                            <RotateCcw className="w-4 h-4" />
                            Return to Dashboard
                        </Button>
                    </div>
                </Card>
            </motion.div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
};
