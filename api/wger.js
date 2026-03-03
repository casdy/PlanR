export default async function handler(req, res) {
  // Extract the path requested after /api/wger/
  // Since we'll rewrite /api/wger/(.*) to /api/wger?path=$1
  const path = req.query?.path || '';
  const searchParams = new URLSearchParams(req.query);
  searchParams.delete('path'); // remove the rewritten path param
  
  const queryString = searchParams.toString();
  const url = `https://wger.de/api/${path}${queryString ? '?' + queryString : ''}`;

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'PlanR/1.0',
  };

  if (process.env.VITE_WGER_API_KEY || process.env.Wger_Key) {
    const key = process.env.VITE_WGER_API_KEY || process.env.Wger_Key;
    headers['Authorization'] = `Token ${key}`;
  }

  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Wger API responded with ${response.status}` });
    }

    const data = await response.json();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    console.error('[wger-proxy] Fetch error:', err.message);
    return res.status(500).json({ error: 'Internal proxy error' });
  }
}
