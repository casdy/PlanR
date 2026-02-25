/**
 * @file src/services/aiService.ts
 * @description AI orchestration layer for workout generation.
 *
 * Primary pathway:  Groq LLM (llama3-70b-8192) → fast structured JSON streaming
 * Fallback pathway: ExerciseDB API → deterministic program build when Groq quota is exhausted
 *
 * `quotaService` gates Groq calls to avoid burning the session API limit in one go.
 * Callers receive either `{ type: 'stream', stream }` or `{ type: 'program', program }`
 * and must handle both cases.
 */
import { groqService } from './groqService';
import { quotaService } from './quotaService';
import { getExercisesByBodyPart } from './exerciseDBService';
import type { WorkoutProgram } from '../types';

// Body-part keyword detection for ExerciseDB fallback
const BODY_PART_MAP: Record<string, string> = {
    chest: 'chest', pec: 'chest', push: 'chest',
    back: 'back', pull: 'back', lat: 'back', row: 'back',
    leg: 'upper legs', squat: 'upper legs', quad: 'upper legs', hamstring: 'upper legs',
    shoulder: 'shoulders', delt: 'shoulders', press: 'shoulders',
    arm: 'upper arms', bicep: 'upper arms', tricep: 'upper arms', curl: 'upper arms',
    core: 'waist', abs: 'waist', abdomen: 'waist', plank: 'waist',
    cardio: 'cardio', run: 'cardio', endurance: 'cardio',
    calf: 'lower legs', glute: 'upper legs',
};

/** Detect a body part keyword from the user's goal string */
function detectBodyPart(goal: string): string {
    const lower = goal.toLowerCase();
    for (const [keyword, bodyPart] of Object.entries(BODY_PART_MAP)) {
        if (lower.includes(keyword)) return bodyPart;
    }
    return 'chest'; // sensible default
}

/** Build a WorkoutProgram from ExerciseDB results — used as quota fallback */
async function buildProgramFromExerciseDB(goal: string): Promise<WorkoutProgram> {
    const bodyPart = detectBodyPart(goal);
    const exercises = await getExercisesByBodyPart(bodyPart);
    const selected = exercises.slice(0, 6);

    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

    return {
        id: crypto.randomUUID(),
        userId: 'generated',
        title: `${bodyPart.replace(/(^\w|\s\w)/g, m => m.toUpperCase())} Focus`,
        description: `AI quota reached. Auto-generated ${bodyPart} workout via ExerciseDB.`,
        icon: 'flame',
        colorTheme: 'orange',
        version: 1,
        isPublic: false,
        schedule: [{
            id: crypto.randomUUID(),
            title: 'Main Workout',
            dayOfWeek,
            type: 'strength',
            durationMin: 45,
            exercises: selected.map(ex => ({
                id: crypto.randomUUID(),
                name: ex.name,
                targetSets: 3,
                targetReps: '10-12',
            }))
        }]
    };
}

/**
 * Master AI Orchestrator — Groq-first with ExerciseDB quota fallback.
 * HuggingFace removed from generation path (was slower & often depleted).
 */
export const aiService = {

    /**
     * Generate a workout routine using Groq AI (primary).
     * Falls back to ExerciseDB auto-build when session quota is exhausted.
     * Returns either a streaming async iterable (Groq) or a resolved `WorkoutProgram` (fallback).
     */
    async generateRoutine(goal: string): Promise<{ type: 'stream'; stream: AsyncIterable<any> } | { type: 'program'; program: WorkoutProgram }> {
        if (!quotaService.canUseGroq()) {
            console.warn('[AI Service] Groq quota exhausted for this session. Falling back to ExerciseDB.');
            const program = await buildProgramFromExerciseDB(goal);
            return { type: 'program', program };
        }

        const prompt = `Create a 3-day workout routine for someone with this goal: "${goal}".
Return ONLY a valid JSON object with "title", "description", "icon", "colorTheme", and "schedule" (array of WorkoutDay objects).
WorkoutDay object: { id, dayOfWeek, title, durationMin, type, exercises: [{ id, name, targetSets, targetReps }] }.
Include 3-4 exercises per day. Use "blue", "emerald", or "orange" for colorTheme. Use "dumbbell", "home", or "flame" for icon.`;

        try {
            console.log('[AI Service] Using Groq (primary).');
            const stream = await groqService.generateTextStream(prompt, 'llama3-70b-8192');
            quotaService.recordGroqUsage(); // record AFTER acquiring stream successfully
            return { type: 'stream', stream };
        } catch (err: any) {
            const isQuotaError =
                err?.message?.includes('429') ||
                err?.message?.includes('quota') ||
                err?.message?.includes('rate limit');

            console.error('[AI Service] Groq error, falling back to ExerciseDB:', err?.message);
            if (isQuotaError) {
                // Force remaining quota to 0 so future calls skip Groq immediately
                while (quotaService.canUseGroq()) quotaService.recordGroqUsage();
            }

            const program = await buildProgramFromExerciseDB(goal);
            return { type: 'program', program };
        }
    },

    /**
     * Parse a workout transcript via Groq (unchanged from before).
     */
    async parseWorkoutTranscript(transcript: string) {
        return groqService.parseWorkoutTranscript(transcript);
    }
};
