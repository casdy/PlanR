// api/workoutdb.js
// Vercel Serverless Function to securely proxy Workout Database API calls
// Direct API docs: https://workoutdb.is-app.in/docs

// Prefer a direct WorkoutDB key if available; fall back to RapidAPI key
const API_KEY = process.env.WORKOUTDB_API_KEY || process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY;
// Use the free direct API endpoint — no RapidAPI subscription required
const BASE_URL = 'https://workoutdb.is-app.in/api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, ...queryParams } = req.query;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    // Reconstruct query string from remaining params
    const searchParams = new URLSearchParams();
    Object.keys(queryParams).forEach(key => {
      searchParams.append(key, queryParams[key]);
    });
    
    const queryStr = searchParams.toString();
    const targetUrl = `${BASE_URL}/${endpoint}${queryStr ? '?' + queryStr : ''}`;

    // Build request headers — key is optional for public endpoints like /health
    const headers = { 'Accept': 'application/json' };
    if (API_KEY) {
      headers['x-rapidapi-key'] = API_KEY;
      headers['x-rapidapi-host'] = 'workoutdb.is-app.in';
    }

    const response = await fetch(targetUrl, { method: 'GET', headers });

    if (!response.ok) {
      let errBody = '';
      try { errBody = await response.text(); } catch (e) {}
      console.error(`[WorkoutDB] API Error (${response.status}):`, errBody);
      return res.status(response.status).json({ error: `Downstream API error ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('[WorkoutDB] Proxy error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
