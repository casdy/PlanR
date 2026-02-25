// api/groq.js
// Vercel Serverless Function to securely proxy Groq API calls

import Groq from 'groq-sdk';
import formidable from 'formidable';
import fs from 'fs';

// Initialize Groq with the secret key from the environment
// No dangerouslyAllowBrowser needed here because this runs on the server!
const groqToken = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: groqToken, maxRetries: 2 });

// Disable default body parser so formidable can handle multipart/form-data for audio uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!groqToken) {
    return res.status(500).json({ error: 'Groq API key is missing on the server' });
  }

  try {
    const contentType = req.headers['content-type'] || '';

    // Route: Audio Transcription (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const form = formidable({ keepExtensions: true });
      
      form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: 'Failed to parse form data' });
        
        const audioFile = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!audioFile) return res.status(400).json({ error: 'No audio file provided' });

        try {
          const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(audioFile.filepath),
            model: 'whisper-large-v3',
            prompt: 'Workout logging audio. Expected to be in English. Short phrases like 10 reps at 150 lbs.',
            response_format: 'json',
            language: 'en',
          });
          
          res.status(200).json({ text: transcription.text });
        } catch (groqErr) {
          console.error('[Backend] Groq Whisper Error:', groqErr);
          res.status(500).json({ error: groqErr.message || 'Transcription failed' });
        } finally {
          // Clean up temp file
          fs.promises.unlink(audioFile.filepath).catch(console.error);
        }
      });
      return;
    }

    // Route: Text Generation (application/json)
    if (contentType.includes('application/json')) {
        // Since Vercel bodyParser is disabled, we must parse the raw body manually
        const rawBody = await new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
        
        const body = JSON.parse(rawBody);
        const { action, prompt, model, temperature, max_tokens, response_format } = body;

        // Action: Chat Completion (Streaming or JSON)
        if (action === 'chat') {
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: model || 'llama3-8b-8192',
                temperature: temperature ?? 0.5,
                max_tokens: max_tokens || 1024,
                top_p: 1,
                stream: false, // Serverless functions don't easily stream to standard fetch without EventSource/SSE
                response_format: response_format || undefined
            });

            return res.status(200).json({ content: completion.choices[0]?.message?.content || '' });
        }

        return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(415).json({ error: 'Unsupported Media Type' });

  } catch (error) {
    console.error('[Backend] Groq API Route Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
