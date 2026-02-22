import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkoutStore } from '../store/workoutStore';
import { hfService } from '../services/hfService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Trophy, Share2, RotateCcw, Loader2 } from 'lucide-react';

export const WorkoutSummary = ({ onRestart }: { onRestart: () => void }) => {
    const { status, exerciseLogs, lastBadgeUrl, setBadgeUrl, cancelWorkout } = useWorkoutStore();
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const generateMyBadge = async () => {
            if (status === 'finished' && !lastBadgeUrl && !isGenerating) {
                setIsGenerating(true);
                try {
                    // Summarize volume
                    let totalVolume = 0;
                    Object.values(exerciseLogs).forEach(sets => {
                        sets.forEach(set => {
                            totalVolume += (set.reps || 0) * (set.weight || 0);
                        });
                    });

                    const prompt = `A hyper-realistic 3D digital gold badge, futuristic gym trophy aesthetic, centered, dark glowing background, representing ${totalVolume > 0 ? totalVolume + ' lbs lifted' : 'a completed workout'}, highly detailed 8k render, Unreal Engine 5 style.`;
                    
                    const blob = await hfService.generateBadge(prompt);
                    const url = URL.createObjectURL(blob);
                    setBadgeUrl(url);
                } catch (err) {
                    console.error("Badge generation failed:", err);
                } finally {
                    setIsGenerating(false);
                }
            }
        };

        generateMyBadge();
    }, [status, lastBadgeUrl, exerciseLogs, setBadgeUrl, isGenerating]);

    if (status !== 'finished') return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md"
            >
                <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white">
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300 animate-bounce" />
                        <h2 className="text-3xl font-black mb-1">WORKOUT COMPLETE</h2>
                        <p className="text-blue-100 opacity-80 uppercase tracking-widest text-xs font-bold">You are getting stronger</p>
                    </div>

                    <div className="p-8 text-center">
                        <div className="relative w-full aspect-square mb-8 bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden flex items-center justify-center border-4 border-slate-50 dark:border-slate-800">
                            {lastBadgeUrl ? (
                                <motion.img 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    src={lastBadgeUrl} 
                                    alt="Achievement Badge" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Forging your badge...</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <Button variant="secondary" className="gap-2 h-12" onClick={() => {
                                cancelWorkout();
                                onRestart();
                            }}>
                                <RotateCcw className="w-4 h-4" />
                                Home
                            </Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 gap-2 h-12">
                                <Share2 className="w-4 h-4" />
                                Share
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};
