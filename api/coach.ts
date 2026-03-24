import { decrementQuota } from './quota';

// 1. Define JSON Schema for Prompt
const coachResponseSchema = {
  type: "array",
  description: "A 7-day fitness coaching plan.",
  items: {
    type: "object",
    properties: {
      day: { type: "integer", description: "Day number from 1 to 7" },
      motivation_message: { type: "string", description: "Short, intense motivational quote under 15 words" },
      nutrition_focus: { type: "string", description: "Specific, actionable nutrition advice for the day" },
      workout_focus: { type: "string", description: "Specific workout advice or recovery focus" },
    },
    required: ["day", "motivation_message", "nutrition_focus", "workout_focus"],
  },
};

export default async function handler(req: any, res: any) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const ip = req.headers['x-forwarded-for'] || 'default';
    
    // 2. Quota Check (Phase 1)
    const hasQuota = decrementQuota(ip as string, 1200); // 1.2k tokens estimate for 7-day batch
    if (!hasQuota) {
        return res.status(429).json({ error: 'AI Sparks Depleted. Please wait 24h.' });
    }

    try {
        const { metrics, goal } = req.body;
        
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("OPENROUTER_API_KEY missing");

        // 3. Prompt Engineering (7-Day Batching)
        const bmi = metrics.weight_kg / Math.pow(metrics.height_cm / 100, 2);
        const bmiCategory = bmi < 18.5 ? 'underweight' : bmi < 25 ? 'healthy' : bmi < 30 ? 'overweight' : 'obese';

        const prompt = `You are Coach PlanR, a world-class fitness and nutrition expert. 
        Generate a highly personalized 7-day fitness and nutrition plan for a user with these metrics: ${JSON.stringify(metrics)} (BMI: ${bmi.toFixed(1)}, Category: ${bmiCategory}) and this goal: ${goal}.
        
        For each day, provide:
        1. A 'motivation_message' tailored to their BMI and goal. Be encouraging but scientific.
        2. A 'praise_message' to be shown ONLY AFTER they complete their workout. It should acknowledge their hard work and give them a reason to look forward to tomorrow.
        3. 'nutrition_focus' and 'workout_focus'.

        Return ONLY valid JSON according to this schema:
        ${JSON.stringify(coachResponseSchema, null, 2)}
        
        Each motivation_message must be under 15 words and intense.
        Each day MUST be unique and build upon the previous.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://planr.app",
                "X-Title": "PlanR",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openrouter/free",
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
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

        const plan = JSON.parse(jsonStr.trim());
        return res.status(200).json(plan);

    } catch (err: any) {
        console.error('[OpenRouter Coach] Error:', err);
        return res.status(500).json({ 
            error: 'Coaching engine stalled.', 
            details: err.message,
            fallback: true 
        });
    }
}
