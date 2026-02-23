import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hfService } from '../services/hfService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Loader2, Sparkles, Plus, Dumbbell, Zap } from 'lucide-react';
import type { WorkoutProgram } from '../types';

const SkeletonCard = () => (
    <div className="w-full h-24 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse mb-3 flex items-center px-4 gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-2 w-1/4 bg-gray-200 dark:bg-slate-700 rounded" />
        </div>
    </div>
);

export const RoutineGenerator = ({ onRoutineGenerated }: { onRoutineGenerated: (program: Omit<WorkoutProgram, 'id' | 'userId' | 'version'>) => void }) => {
    const [goal, setGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamedContent, setStreamedContent] = useState('');
    const [discoveredExercises, setDiscoveredExercises] = useState<string[]>([]);

    useEffect(() => {
        // Regex to find exercise names in the streaming JSON
        const names = streamedContent.match(/"name":\s*"([^"]+)"/g);
        if (names) {
            const cleanNames = names.map(n => n.replace(/"name":\s*"/, '').replace(/"/, ''));
            setDiscoveredExercises(prev => {
                const newOnes = cleanNames.filter(n => !prev.includes(n));
                return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
            });
        }
    }, [streamedContent]);

    const handleGenerate = async () => {
        if (!goal) return;
        setIsGenerating(true);
        setStreamedContent('');
        setDiscoveredExercises([]);
        
        try {
            const prompt = `Create a 3-day workout routine for someone with this goal: "${goal}".
            Return ONLY a valid JSON object with "title", "description", "icon", "colorTheme", and "schedule" (array of WorkoutDay objects).
            WorkoutDay object: { id, dayOfWeek, title, durationMin, type, exercises: [{ id, name, targetSets, targetReps }] }.
            Include 3 exercises per day. Use "blue", "emerald", or "orange" for colorTheme. Use "dumbbell", "home", or "flame" for icon.`;

            const stream = await hfService.generateFastTextStream(prompt);
            let fullText = '';
            
            for await (const chunk of stream) {
                if (chunk.choices[0].delta.content) {
                    fullText += chunk.choices[0].delta.content;
                    setStreamedContent(fullText);
                }
            }

            const match = fullText.match(/\{.*\}/s);
            if (match) {
                const program = JSON.parse(match[0]);
                // Simulate a slight delay for the transition animation feel
                setTimeout(() => onRoutineGenerated(program), 800);
            }
        } catch (err) {
            console.error("Failed to generate routine:", err);
            setIsGenerating(false);
        }
    };

    return (
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 border-indigo-100 dark:border-indigo-900/30 overflow-hidden relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                    <h2 className="text-xl font-bold">AI Workout Architect</h2>
                </div>
                {isGenerating && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-tighter">
                        <Zap className="w-3 h-3 animate-bounce" />
                        Live Streaming
                    </div>
                )}
            </div>
            
            <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., I want a 45-minute pull day focused on lats."
                className="w-full h-24 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none mb-4 text-sm font-medium"
                disabled={isGenerating}
            />

            <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !goal}
                className={cn(
                    "w-full h-12 gap-2 transition-all duration-500",
                    isGenerating ? "bg-slate-100 text-slate-400 dark:bg-slate-800" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                )}
            >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {isGenerating ? 'Architecting your routine...' : 'Generate New Routine'}
            </Button>

            <AnimatePresence>
                {isGenerating && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-6 space-y-3"
                    >
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Progressive Discovery</span>
                            <span className="text-[11px] font-mono text-indigo-500">{discoveredExercises.length} / 9 Exercises Found</span>
                        </div>

                        {/* Mixed Skeletons and Real Discovered Data */}
                        <div className="space-y-3">
                            {discoveredExercises.map((name) => (
                                <motion.div 
                                    key={name}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="w-full h-24 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/20 p-4 flex items-center gap-4 shadow-sm"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <Dumbbell className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm truncate">{name}</h4>
                                        <div className="flex gap-2 mt-1">
                                            <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                            <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                                </motion.div>
                            ))}
                            
                            {/* Remaining Skeletons */}
                            {Array.from({ length: Math.max(0, 3 - discoveredExercises.length) }).map((_, i) => (
                                <SkeletonCard key={`skel-${i}`} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

// Helper for Tailwind
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
