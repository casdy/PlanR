import { checkRateLimit } from './rate-limit.js';

export default async function handler(req, res) {
  // 1. Rate Limiting
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  // 2. Extract Path
  const path = req.query?.path || '';
  const searchParams = new URLSearchParams(req.query);
  searchParams.delete('path'); 
  
  const queryString = searchParams.toString();
  const url = `https://world.openfoodfacts.org/${path}${queryString ? '?' + queryString : ''}`;

  // 3. Identification Headers (Mandatory for OFF)
  // Format: AppName - Platform - Version - Contact
  const version = process.env.VITE_APP_VERSION || '1.0.0';
  const environment = process.env.NODE_ENV || 'development';
  const userAgent = `PlanR - Web - ${version} (${environment}) - contact@planr.app`;

  const headers = {
    'Accept': 'application/json',
    'User-Agent': userAgent,
    'X-Identify': userAgent // Sometimes used as an alternative
  };

  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `OpenFoodFacts API responded with ${response.status}` });
    }

    const data = await response.json();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    console.error('[off-proxy] Fetch error:', err.message);
    return res.status(500).json({ error: 'Internal proxy error' });
  }
}
