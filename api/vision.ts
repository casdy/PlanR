import { decrementQuota } from './quota';

/**
 * @file api/vision.ts
 * @description OpenRouter-powered Vision Engine for nutritional analysis.
 */

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
    
    // 1. Quota Check (Phase 1)
    // Vision typically costs more or uses more tokens, but we use a fixed estimate for simplicity.
    const hasQuota = decrementQuota(ip as string, 2000); 
    if (!hasQuota) {
        return res.status(429).json({ error: 'AI Sparks Depleted. Please wait 24h.' });
    }

    try {
        const { image } = req.body;
        if (!image) {
            throw new Error("No image provided");
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("OPENROUTER_API_KEY missing");

        // Prepare base64 image (ensure it has the data header)
        let base64Image = image;
        if (base64Image.includes(',')) {
            // If it already has a header, leave it or re-format if needed.
            // OpenAI likes data:image/jpeg;base64,...
        } else {
            base64Image = `data:image/jpeg;base64,${base64Image}`;
        }

        // 2. OpenRouter Config
    // Use the NVIDIA Nemotron Nano 12B VL Free model as it is currently stable for vision tasks on OpenRouter
    const VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free";
        
        const prompt = "Analyze this food item or barcode. Identify the product and provide full nutritional breakdown in JSON. Return strictly valid JSON.";
        const schemaInstr = `
        Return JSON matching this structure:
        {
            "productName": "string",
            "calories": integer,
            "protein": integer,
            "carbs": integer,
            "fats": integer,
            "ingredients": ["string"]
        }
        `;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://planr.app",
                "X-Title": "PlanR",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: VISION_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `${prompt}\n${schemaInstr}` },
                            {
                                type: "image_url",
                                image_url: { url: base64Image }
                            }
                        ]
                    }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const error = await response.json();
            if (response.status === 429) {
                throw new Error("OpenRouter Free Tier Congested. Please try again in a few minutes.");
            }
            throw new Error(error.error?.message || `OpenRouter Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Handle potential markdown wrapping
        let jsonStr = content;
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

        const result = JSON.parse(jsonStr.trim());

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json(result);

    } catch (err: any) {
        console.error('[OpenRouter Vision] Error:', err);
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(500).json({ 
            error: 'Vision engine stalled.', 
            details: err.message
        });
    }
}
