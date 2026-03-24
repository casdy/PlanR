import { describe, it, expect, vi, beforeEach } from 'vitest';
import httpMocks from 'node-mocks-http';
import handler from '../coach';
import { decrementQuota } from '../quota';

// Mock the quota module
vi.mock('../quota', () => ({
  decrementQuota: vi.fn(() => true),
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Coach API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a 7-day plan successfully', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        metrics: { weight: 80, height: 180 },
        goal: 'muscle_gain'
      },
      headers: {
        'x-forwarded-for': '127.0.0.1'
      }
    });
    const res = httpMocks.createResponse();

    // Mock successful OpenRouter response
    const mockContent = JSON.stringify([
      { day: 1, motivation_message: "Focus!", praise_message: "Good job!", nutrition_focus: "Protein", workout_focus: "Chest" }
    ]);

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockContent } }]
      })
    });

    process.env.OPENROUTER_API_KEY = 'test-key';

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data[0].day).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('openrouter.ai'),
        expect.anything()
    );
  });

  it('handles 429 errors from OpenRouter', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { metrics: {}, goal: 'fat_loss' }
    });
    const res = httpMocks.createResponse();

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: "Rate limit reached" } })
    });

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.details).toContain('OpenRouter Free Tier Congested');
  });

  it('fails if quota is depleted', async () => {
    (decrementQuota as any).mockReturnValue(false);
    
    const req = httpMocks.createRequest({ method: 'POST' });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(429);
    expect(JSON.parse(res._getData()).error).toContain('AI Sparks Depleted');
  });
});
