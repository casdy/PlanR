import { decrementQuota } from './quota';

/**
 * @file api/vision.ts
 * @description OpenRouter-powered Vision Engine with multi-model fallback chain.
 *
 * Tries multiple free vision models in order of reliability.
 * If Model A returns 429/5xx, automatically falls through to Model B, etc.
 */

// Free vision models ordered by reliability and quality (best first)
const VISION_MODELS = [
  'meta-llama/llama-4-maverick:free',
  'qwen/qwen2.5-vl-32b-instruct:free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-4-scout:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
];

const PROMPT = `Analyze this food item or product. Identify it and provide estimated nutritional information per serving.
Return ONLY valid JSON matching this exact structure:
{
  "productName": "string",
  "calories": integer,
  "protein": integer,
  "carbs": integer,
  "fats": integer,
  "ingredients": ["string"]
}
Do not wrap in markdown. Do not add explanation. Return ONLY the JSON object.`;

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || 'default';
  const hasQuota = decrementQuota(ip as string, 2000);
  if (!hasQuota) {
    return res.status(429).json({ error: 'AI Sparks Depleted. Please wait 24h.' });
  }

  try {
    const { image } = req.body;
    if (!image) throw new Error('No image provided');

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY missing');

    // ── Normalize the base64 data URL ──────────────────────────────
    // The client sends "data:image/jpeg;base64,<data>".
    // We need to ensure it's in this exact format for OpenRouter.
    let imageUrl: string;

    if (image.startsWith('data:image/')) {
      // Already a proper data URL — use as-is
      imageUrl = image;
    } else if (image.startsWith('data:') && !image.startsWith('data:image/')) {
      // Unusual data URL (e.g. "data:application/octet-stream;base64,...")
      // Extract the raw base64 and re-wrap as JPEG
      const base64Part = image.split(',')[1] || image;
      imageUrl = `data:image/jpeg;base64,${base64Part}`;
    } else {
      // Raw base64 string with no data URL prefix
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    // Safety: reject payloads over ~10 MB to avoid upstream timeouts
    const payloadSizeKB = Math.round(imageUrl.length / 1024);
    console.log(`[Vision] Image payload: ${payloadSizeKB} KB`);

    if (imageUrl.length > 10_000_000) {
      return res.status(413).json({ error: 'Image too large. Please use a smaller image.' });
    }

    // Try each model in order until one succeeds
    let lastError = '';
    for (const model of VISION_MODELS) {
      try {
        console.log(`[Vision] Trying model: ${model}`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://planr.app',
            'X-Title': 'PlanR',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: PROMPT },
                  { type: 'image_url', image_url: { url: imageUrl } },
                ],
              },
            ],
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          lastError = errBody.error?.message || `${model} returned ${response.status}`;
          console.warn(`[Vision] ${model} failed (${response.status}): ${lastError}`);

          // If rate-limited or server error, try next model
          if (response.status === 429 || response.status >= 500) continue;

          // For other errors (400, 401, etc.), still try next model
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
          lastError = `${model} returned empty content`;
          console.warn(`[Vision] ${lastError}`);
          continue;
        }

        // Strip any markdown wrapping
        let jsonStr = content;
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

        const result = JSON.parse(jsonStr.trim());

        console.log(`[Vision] Success with model: ${model}`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json(result);

      } catch (modelErr: any) {
        lastError = modelErr.message || `${model} threw an exception`;
        console.warn(`[Vision] ${model} exception: ${lastError}`);
        continue;
      }
    }

    // All models failed
    throw new Error(`All vision models failed. Last error: ${lastError}`);

  } catch (err: any) {
    console.error('[Vision] Final error:', err.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Vision engine failed.',
      details: err.message,
    });
  }
}
