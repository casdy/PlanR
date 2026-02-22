import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hfService } from '../services/hfService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Loader2, Sparkles, Plus, Dumbbell } from 'lucide-react';
import type { WorkoutProgram, WorkoutDay } from '../types';

export const RoutineGenerator = ({ onRoutineGenerated }: { onRoutineGenerated: (program: Omit<WorkoutProgram, 'id' | 'userId' | 'version'>) => void }) => {
    const [goal, setGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamedContent, setStreamedContent] = useState('');

    const handleGenerate = async () => {
        if (!goal) return;
        setIsGenerating(true);
        setStreamedContent('');
        
        try {
            const prompt = `Create a 3-day workout routine for someone with this goal: "${goal}".
            Return ONLY a JSON object with "title", "description", "icon", "colorTheme", and "schedule" (array of WorkoutDay objects).
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

            // Parse the final JSON
            const match = fullText.match(/\{.*\}/s);
            if (match) {
                const program = JSON.parse(match[0]);
                onRoutineGenerated(program);
            }
        } catch (err) {
            console.error("Failed to generate routine:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold">AI Routine Builder</h2>
            </div>
            
            <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., I want to build upper body strength at home with no equipment, 3 days a week."
                className="w-full h-32 p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none mb-4"
            />

            <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !goal}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 gap-2"
            >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {isGenerating ? 'Generating Your Routine...' : 'Generate AI Routine'}
            </Button>

            <AnimatePresence>
                {isGenerating && streamedContent && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Dumbbell className="w-4 h-4 text-blue-500 animate-bounce" />
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Dreaming up exercises...</span>
                        </div>
                        <div className="text-xs font-mono text-gray-600 dark:text-gray-400 line-clamp-6 opacity-50">
                            {streamedContent}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};
