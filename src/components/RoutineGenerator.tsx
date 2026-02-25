import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../services/aiService';
import { quotaService } from '../services/quotaService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Loader2, Sparkles, Plus, Dumbbell, Zap, AlertTriangle } from 'lucide-react';
import type { WorkoutProgram } from '../types';
import { cn } from '../lib/utils';

const SkeletonCard = () => (
    <div className="w-full h-24 rounded-2xl bg-secondary/50 animate-pulse mb-3 flex items-center px-4 gap-4">
        <div className="w-10 h-10 rounded-full bg-secondary" />
        <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 bg-secondary rounded" />
            <div className="h-2 w-1/4 bg-secondary rounded" />
        </div>
    </div>
);

export const RoutineGenerator = ({ onRoutineGenerated }: { onRoutineGenerated: (program: Omit<WorkoutProgram, 'id' | 'userId' | 'version'>) => void }) => {
    const [goal, setGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamedContent, setStreamedContent] = useState('');
    const [discoveredExercises, setDiscoveredExercises] = useState<string[]>([]);
    const [usedFallback, setUsedFallback] = useState(false);
    const [remaining, setRemaining] = useState(quotaService.getRemainingGroq());

    useEffect(() => {
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
        setUsedFallback(false);

        try {
            const result = await aiService.generateRoutine(goal);

            if (result.type === 'program') {
                // ExerciseDB fallback path — no streaming
                setUsedFallback(true);
                setTimeout(() => onRoutineGenerated(result.program), 800);
            } else {
                // Groq streaming path
                let fullText = '';
                for await (const chunk of result.stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        fullText += content;
                        setStreamedContent(fullText);
                    }
                }
                const match = fullText.match(/\{.*\}/s);
                if (match) {
                    const program = JSON.parse(match[0]);
                    setTimeout(() => onRoutineGenerated(program), 800);
                }
            }
        } catch (err) {
            console.error('Failed to generate routine:', err);
        } finally {
            setRemaining(quotaService.getRemainingGroq());
            setIsGenerating(false);
        }
    };

    const quotaExhausted = remaining === 0;

    return (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-card dark:from-primary/10 dark:to-card border-primary/10 overflow-hidden relative rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <h2 className="text-xl font-black tracking-tight">AI Workout Architect</h2>
                </div>
                <div className="flex items-center gap-2">
                    {isGenerating && !usedFallback && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-tighter">
                            <Zap className="w-3 h-3 animate-bounce" />
                            Streaming
                        </div>
                    )}
                    {/* Quota indicator */}
                    <div className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        quotaExhausted
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-primary/10 text-primary"
                    )}>
                        {quotaExhausted ? '📦 Library Mode' : `⚡ ${remaining} AI left`}
                    </div>
                </div>
            </div>

            {quotaExhausted && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-500/5 border border-orange-500/20 mb-4">
                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground font-medium">
                        AI quota reached for this session. Routines will be auto-generated from ExerciseDB — still great workouts!
                    </p>
                </div>
            )}

            <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., I want a 45-minute pull day focused on lats."
                className="w-full h-24 p-4 rounded-2xl border border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none mb-4 text-sm font-medium"
                disabled={isGenerating}
            />

            <Button
                onClick={handleGenerate}
                disabled={isGenerating || !goal}
                variant="primary"
                className={cn(
                    "w-full h-12 gap-2 font-bold rounded-2xl transition-all duration-500 shadow-lg shadow-primary/20",
                    isGenerating && "opacity-70"
                )}
            >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {isGenerating
                    ? (usedFallback ? 'Building from Exercise Library...' : 'Architecting your routine...')
                    : (quotaExhausted ? '+ Generate from Library' : '+ Generate New Routine')
                }
            </Button>

            <AnimatePresence>
                {isGenerating && !usedFallback && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-6 space-y-3"
                    >
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Progressive Discovery</span>
                            <span className="text-[11px] font-mono text-primary">{discoveredExercises.length} Exercises Found</span>
                        </div>

                        <div className="space-y-3">
                            {discoveredExercises.map((name) => (
                                <motion.div
                                    key={name}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="w-full h-20 rounded-2xl bg-card border border-primary/10 p-4 flex items-center gap-4 shadow-sm"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Dumbbell className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm">{name}</h4>
                                    </div>
                                    <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                                </motion.div>
                            ))}

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
