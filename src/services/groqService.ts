/**
 * @file src/services/groqService.ts
 * @description Groq AI inference service.
 *
 * This version safely routes all requests to the Vercel Serverless Function 
 * (`/api/groq`) so the `GROQ_API_KEY` is never exposed in the browser bundle.
 */

export const groqService = {
  isAvailable: true, // Serverless fn handles key validation

  /**
   * Fast text generation optimized for low latency.
   * Note: The serverless proxy currently returns the full response at once (no streaming).
   */
  async generateFastTextStream(prompt: string, model: string = 'llama3-8b-8192') {
    const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', prompt, model, temperature: 0.5, max_tokens: 1024 })
    });

    if (!response.ok) throw new Error(`[Backend] Failed to generate: ${response.statusText}`);
    
    const data = await response.json();
    
    // Simulate streaming interface for existing components
    return {
        async *[Symbol.asyncIterator]() {
            yield { choices: [{ delta: { content: data.content } }] };
        }
    };
  },

  /**
   * Powerful text generation optimized for complex reasoning.
   */
  async generateTextStream(prompt: string, model: string = 'llama3-70b-8192') {
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', prompt, model, temperature: 0.7, max_tokens: 2048 })
    });

    if (!response.ok) throw new Error(`[Backend] Failed to generate: ${response.statusText}`);
    
    const data = await response.json();
    
    return {
        async *[Symbol.asyncIterator]() {
            yield { choices: [{ delta: { content: data.content } }] };
        }
    };
  },

  /**
   * Parse a workout transcript into structured JSON (reps and weight).
   */
  async parseWorkoutTranscript(transcript: string): Promise<{ reps: number, weight: number } | null> {
    const prompt = `Extract workout data from this transcript: "${transcript}". 
    Return ONLY a valid JSON object with "reps" and "weight" as numbers. 
    If weight is not mentioned, use 0. If reps are not mentioned, use 0.
    Example: "12 reps at 225" -> {"reps": 12, "weight": 225}`;

    try {
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'chat', 
            prompt, 
            model: 'llama3-8b-8192', 
            temperature: 0.1,
            response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) return null;
      
      const data = await response.json();
      return JSON.parse(data.content);
    } catch (err) {
      console.error('[Groq] Failed to fetch or parse transcript', err);
    }
    return null;
  },

  /**
   * Transcribe an audio blob to text via the backend proxy.
   */
  async transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const response = await fetch('/api/groq', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `[Backend] Failed to transcribe: ${response.statusText}`);
      }

      const data = await response.json();
      return { text: data.text };
    } catch (err: any) {
      console.error('[Groq] Fetch error transcribing audio:', err);
      throw new Error(err.message || 'Transcription failed');
    }
  }
};
