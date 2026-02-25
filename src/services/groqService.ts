import Groq from 'groq-sdk';

const groqToken = import.meta.env.VITE_GROQ_API_KEY || '';

if (!groqToken) {
  console.warn('[Security] VITE_GROQ_API_KEY is missing. Groq AI features are disabled.');
}

// Dangerously allow browser for purely client-side MVP apps. 
// In production, Groq API calls MUST go through a proxy backend.
const groq = new Groq({ apiKey: groqToken, dangerouslyAllowBrowser: true, maxRetries: 2 });

/**
 * AI Service using Groq's ultra-fast inference edge network.
 */
export const groqService = {
  isAvailable: !!groqToken,

  /**
   * Fast text generation optimized for low latency.
   * Defaults to the blazing fast Llama 3 8B.
   */
  async generateFastTextStream(prompt: string, model: string = 'llama3-8b-8192') {
    return groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model,
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
    });
  },

  /**
   * Powerful text generation optimized for complex reasoning.
   * Defaults to Llama 3 70B limit.
   */
  async generateTextStream(prompt: string, model: string = 'llama3-70b-8192') {
     return groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: true,
    });
  },

  /**
   * Parse a workout transcript into structured JSON (reps and weight).
   * Swapped from HF Qwen to Groq Llama3 for zero-latency UI response.
   */
  async parseWorkoutTranscript(transcript: string): Promise<{ reps: number, weight: number } | null> {
    const prompt = `Extract workout data from this transcript: "${transcript}". 
    Return ONLY a valid JSON object with "reps" and "weight" as numbers. 
    If weight is not mentioned, use 0. If reps are not mentioned, use 0.
    Example: "12 reps at 225" -> {"reps": 12, "weight": 225}`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.1, // extremely low temp for strict JSON adherence
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content || '';
      return JSON.parse(content);
    } catch (err) {
      console.error('[Groq] Failed to parse transcript', err);
    }
    return null;
  },

  /**
   * Transcribe an audio blob to text using Groq's fast Whisper implementation.
   */
  async transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
    try {
      const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      const transcription = await groq.audio.transcriptions.create({
        file: file,
        model: 'whisper-large-v3',
        prompt: 'Workout logging audio. Expected to be in English. Short phrases like 10 reps at 150 lbs.',
        response_format: 'json',
        language: 'en',
      });
      return { text: transcription.text };
    } catch (err: any) {
      console.error('[Groq] Failed to transcribe audio', err);
      throw new Error(err.message || 'Transcription failed');
    }
  }
};
