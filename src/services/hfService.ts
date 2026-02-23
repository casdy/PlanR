import { HfInference } from '@huggingface/inference';

const hfToken = import.meta.env.VITE_HF_API_TOKEN || '';

if (!hfToken || hfToken === 'REDACTED_FOR_SECURITY' || hfToken.length < 5) {
  console.warn('[Security] VITE_HF_API_TOKEN is missing or invalid. AI features (Voice Parsing, Image Gen) are disabled.');
}

// Initializing with empty string is safe but calls will fail gracefully
const client = new HfInference(hfToken);

/**
 * AI Service using Hugging Face Inference ecosystem.
 */
export const hfService = {
  /**
   * Check if the service is configured with a valid token.
   */
  isAvailable: hfToken.length > 5 && hfToken !== 'REDACTED_FOR_SECURITY',
  /**
   * Universal text generation with smart routing and auto-fallback.
   * Utilizes :cheapest routing and auto provider provider policy.
   */
  async generateTextStream(prompt: string, model: string = 'Qwen/Qwen2.5-72B-Instruct') {
    // Append :cheapest for cost optimization
    const routedModel = `${model}:cheapest`;
    
    return client.chatCompletionStream({
      model: routedModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      provider: 'auto', // Fallback policy
    });
  },

  /**
   * Fast text generation using high-performance providers (Groq/SambaNova).
   */
  async generateFastTextStream(prompt: string) {
    // These providers are managed by HF's routing
    return client.chatCompletionStream({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      provider: 'auto', // Will likely route to fast providers if available/configured
    });
  },

  /**
   * Speech-to-Text using Whisper.
   */
  async speechToText(audioBlob: Blob) {
    return client.automaticSpeechRecognition({
      model: 'openai/whisper-large-v3-turbo',
      data: audioBlob,
    });
  },

  /**
   * Image generation using FLUX.
   */
  async generateBadge(prompt: string) {
    return client.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: prompt,
      parameters: {
        num_inference_steps: 4, // Fast generation
      }
    });
  },

  /**
   * Parse a workout transcript into structured JSON (reps and weight).
   */
  async parseWorkoutTranscript(transcript: string): Promise<{ reps: number, weight: number } | null> {
    const prompt = `Extract workout data from this transcript: "${transcript}". 
    Return ONLY a JSON object with "reps" and "weight" as numbers. 
    If weight is not mentioned, use 0. If reps are not mentioned, use 0.
    Example: "12 reps at 225" -> {"reps": 12, "weight": 225}`;

    try {
      const response = await client.chatCompletion({
        model: 'Qwen/Qwen2.5-72B-Instruct:cheapest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        provider: 'auto',
      });

      const content = response.choices[0].message.content || '';
      const match = content.match(/\{.*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (err) {
      console.error('Failed to parse transcript', err);
    }
    return null;
  }
};
