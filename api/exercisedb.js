// api/exercisedb.js
// Vercel Serverless Function to securely proxy ExerciseDB API calls

const RAPID_API_KEY = process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY;
const BASE_URL = 'https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!RAPID_API_KEY) {
    return res.status(500).json({ error: 'RapidAPI key is missing on the server' });
  }

  try {
    // Determine target endpoint
    const { endpoint, ...queryParams } = req.query;
    
    if (!endpoint) {
        return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    // Reconstruct query string
    const searchParams = new URLSearchParams();
    Object.keys(queryParams).forEach(key => {
        searchParams.append(key, queryParams[key]);
    });
    
    const queryStr = searchParams.toString();
    const targetUrl = `${BASE_URL}/${endpoint}${queryStr ? '?' + queryStr : ''}`;

    // Forward the request and attach secure headers
    const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        let errBody = '';
        try { errBody = await response.text(); } catch (e) {}
        console.error(`[Backend] RapidAPI Error (${response.status}):`, errBody);
        return res.status(response.status).json({ error: `Downstream API error ${response.status}` });
    }

    // Proxy raw media streams (videos/images)
    if (endpoint.includes('media')) {
        const contentType = response.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        
        // Vercel serverless functions require array buffers for binary data
        const buffer = await response.arrayBuffer();
        res.status(200);
        res.send(Buffer.from(buffer));
        return;
    }

    // Proxy standard JSON payloads
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('[Backend] ExerciseDB Proxy Route Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
