import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * @file tests/smoke.test.ts
 * @description Real-world connectivity test for OpenRouter.
 * Requires a valid OPENROUTER_API_KEY in the environment.
 */

describe('OpenRouter Smoke Test (Live)', () => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  it('OpenRouter API Key is present', () => {
    expect(apiKey).toBeDefined();
    expect(apiKey?.length).toBeGreaterThan(10);
  });

  it('Live Check: Text Completion (openrouter/free)', async () => {
    if (!apiKey) return;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://planr.app",
        "X-Title": "PlanR Test"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: "Say 'CONNECTED' if you receive this." }],
        max_tokens: 10
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.choices[0].message.content).toContain('CONNECTED');
  }, 20000); // 20s timeout for live API

  it('Live Check: Vision Completion (Llama 3.2 Free Vision)', async () => {
    if (!apiKey) return;

    // Small transparent pixel as base64
    const mockImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What color is this 1x1 image?" },
              { type: "image_url", image_url: { url: mockImage } }
            ]
          }
        ],
        max_tokens: 20
      })
    });

    if (!response.ok) {
        const err = await response.json();
        console.error('Vision Smoke Test Failed:', JSON.stringify(err, null, 2));
    }

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.choices[0].message.content).toBeDefined();
  }, 40000); // 40s timeout for vision due to free tier latency
});
