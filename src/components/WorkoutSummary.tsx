/**
 * @file src/components/WorkoutSummary.tsx
 * @description Post-workout achievement modal shown when a session finishes.
 *
 * Rendered by ActiveWorkoutOverlay when `workoutStore.status === 'finished'`.
 * Generates and displays a deterministic SVG achievement badge via `thumbnailService`,
 * logs the final session data to LocalService, and provides options to
 * save, share, or return to the Dashboard.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkoutStore } from '../store/workoutStore';
import { thumbnailService } from '../services/thumbnailService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Trophy, Share2, RotateCcw, Download, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LocalService } from '../services/localService';

export const WorkoutSummary = ({ onRestart }: { onRestart: () => void }) => {
    const { status, badgePrompt, achievementTitle, achievementSubtitle, lastBadgeUrl, setBadgeUrl, cancelWorkout } = useWorkoutStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const [isLogging, setIsLogging] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const finalizeWorkout = async () => {
            if (status === 'finished' && !isLogging) {
                setIsLogging(true);
                try {
                    const userId = user?.id || 'guest';
                    // Log the workout to SQLite (Supabase under the hood)
                    const { activeProgramId, activeDayId, totalSessionSeconds, completedExerciseIds, activeSessionId } = useWorkoutStore.getState();
                    if (activeProgramId && activeDayId && activeSessionId) {
                        await LocalService.logWorkout({
                            programId: activeProgramId,
                            dayId: activeDayId,
                            sessionId: activeSessionId,
                            totalTimeSpentSec: totalSessionSeconds,
                            userId: userId,
                            completedExerciseIds: completedExerciseIds,
                            date: new Date().toISOString()
                        }, userId);
                    }
                } catch (err) {
                    console.error("Workout logging failed:", err);
                }
            }
        };

        const generateMyBadge = () => {
            if (status === 'finished' && badgePrompt && !lastBadgeUrl && !isGenerating) {
                setIsGenerating(true);
                try {
                    // Synchronous generation for deterministic badge
                    const url = thumbnailService.generateBadge(badgePrompt);
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
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <Card className="overflow-hidden border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] bg-[#0f121b] rounded-[2rem]">
                    {/* Top Header - Blue Gradient */}
                    <div className="bg-gradient-to-b from-[#385cf0] to-[#513cf0] pt-10 pb-8 px-6 text-center text-white relative">
                        <Trophy className="w-14 h-14 mx-auto mb-3 text-[#F2DF3D]" strokeWidth={1.5} />
                        <h2 className="text-[22px] font-black tracking-wide mb-1">
                            {achievementTitle || "BEAST MODE"}
                        </h2>
                        <p className="text-white/80 text-[8px] font-black uppercase tracking-[0.2em] opacity-90">
                            {achievementSubtitle || "NEW ACHIEVEMENT UNLOCKED"}
                        </p>
                    </div>

                    {/* Middle Section - Image / Loader */}
                    <div className="p-6 pb-5 text-center">
                        <div className="relative w-full aspect-square mb-6 bg-[#05060a] rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                            {lastBadgeUrl ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full h-full"
                                >
                                    <img 
                                        src={lastBadgeUrl} 
                                        alt="Achievement Badge" 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-3 right-3 animate-bounce">
                                        <div className="bg-[#0f121b]/80 p-1.5 rounded-full shadow-lg backdrop-blur-sm">
                                            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center gap-5 relative w-full h-full justify-center">
                                    <div className="w-12 h-12 rounded-full border-[3px] border-[#2a2d48] border-t-[#665DDC] animate-spin" />
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                        Forging Achievement...
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <Button 
                                variant="secondary" 
                                className="gap-2 h-11 rounded-xl bg-[#1e2330] hover:bg-[#282d3b] border-none text-[10px] font-black uppercase tracking-widest text-[#9ca3af] hover:text-white transition-colors"
                                onClick={handleDownload} 
                                disabled={!lastBadgeUrl}
                            >
                                <Download className="w-3.5 h-3.5" strokeWidth={2.5} /> Save
                            </Button>
                            <Button 
                                className="bg-[#5C45F4] hover:bg-[#6c57f5] gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#5C45F4]/20 transition-all"
                            >
                                <Share2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Share
                            </Button>
                        </div>

                        <button 
                            className="w-full flex items-center justify-center gap-2 text-[11px] font-bold text-gray-400 hover:text-gray-200 transition-colors"
                            onClick={() => {
                                cancelWorkout();
                                onRestart();
                            }}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Return to Dashboard
                        </button>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};
