import { hfService } from './hfService';
import { groqService } from './groqService';

// Session-level sticky switch to prefer Groq if HF fails with 402
let preferGroq = false;

/**
 * Master AI Orchestrator with automatic fallback.
 * Detects 402 (Payment Required) from HF and switches to Groq.
 */
export const aiService = {
  /**
   * Universal text generation with automatic provider fallback.
   */
  async generateRoutine(goal: string) {
    const prompt = `Create a 3-day workout routine for someone with this goal: "${goal}".
    Return ONLY a valid JSON object with "title", "description", "icon", "colorTheme", and "schedule" (array of WorkoutDay objects).
    WorkoutDay object: { id, dayOfWeek, title, durationMin, type, exercises: [{ id, name, targetSets, targetReps }] }.
    Include 3 exercises per day. Use "blue", "emerald", or "orange" for colorTheme. Use "dumbbell", "home", or "flame" for icon.`;

    if (preferGroq) {
      console.log('[AI Service] Using Groq (Sticky Fallback Active)');
      return groqService.generateTextStream(prompt, 'llama3-70b-8192');
    }

    try {
      console.log('[AI Service] Attempting Hugging Face...');
      // We return the stream directly
      return await hfService.generateFastTextStream(prompt);
    } catch (err: any) {
      // Detect 402 Payment Required
      const isBillingError = 
        err?.message?.includes('402') || 
        err?.message?.includes('Payment Required') || 
        err?.message?.includes('Credit balance is depleted');

      if (isBillingError) {
        console.warn('[AI Service] Hugging Face credits depleted. Falling back to Groq.');
        preferGroq = true; // Set sticky switch
        return groqService.generateTextStream(prompt, 'llama3-70b-8192');
      }
      
      console.error('[AI Service] Unexpected HF Error:', err);
      // Fallback to Groq for ANY error to ensure UI resilience
      return groqService.generateTextStream(prompt, 'llama3-70b-8192');
    }
  },

  /**
   * Parse a workout transcript with automatic fallback.
   */
  async parseWorkoutTranscript(transcript: string) {
    if (preferGroq) {
      return groqService.parseWorkoutTranscript(transcript);
    }

    try {
      return await hfService.parseWorkoutTranscript(transcript);
    } catch (err: any) {
      if (err?.message?.includes('402')) {
        preferGroq = true;
        return groqService.parseWorkoutTranscript(transcript);
      }
      return groqService.parseWorkoutTranscript(transcript);
    }
  }
};
