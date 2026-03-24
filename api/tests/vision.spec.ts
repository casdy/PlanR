import { describe, it, expect, vi, beforeEach } from 'vitest';
import httpMocks from 'node-mocks-http';
import handler from '../vision';
import { decrementQuota } from '../quota';

// Mock the quota module
vi.mock('../quota', () => ({
  decrementQuota: vi.fn(() => true),
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Vision API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('analyzes an image successfully', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        image: 'data:image/jpeg;base64,mockdata'
      }
    });
    const res = httpMocks.createResponse();

    const mockAiResponse = JSON.stringify({
      productName: "Generic Whey Protein",
      calories: 120,
      protein: 24,
      carbs: 3,
      fats: 1,
      ingredients: ["Whey", "Cocoa"]
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockAiResponse } }]
      })
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.productName).toBe("Generic Whey Protein");
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('openrouter.ai'),
        expect.objectContaining({
            body: expect.stringContaining('nvidia/nemotron-nano-12b-v2-vl:free')
        })
    );
  });

  it('handles missing image error', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {}
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res._getData()).details).toContain('No image provided');
  });
});
