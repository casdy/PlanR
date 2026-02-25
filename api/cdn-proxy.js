// api/cdn-proxy.js
// Vercel Serverless Function: proxies exercise media from cdn.exercisedb.dev
//
// Accepts the full CDN URL as a `url` query parameter:
//   GET /api/cdn-proxy?url=https://cdn.exercisedb.dev/path/to/file.mp4
//
// This adds Cross-Origin-Resource-Policy: cross-origin so media loads
// correctly in browsers with Cross-Origin-Embedder-Policy: require-corp.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const targetUrl = req.query?.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing `url` query parameter' });
  }

  // Only proxy URLs from the trusted CDN — reject anything else
  if (!targetUrl.startsWith('https://cdn.exercisedb.dev/')) {
    return res.status(403).json({ error: 'Forbidden: only cdn.exercisedb.dev URLs are allowed' });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PlanR/1.0)',
        'Accept': '*/*',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `CDN responded with ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('[cdn-proxy] Fetch error:', err.message);
    return res.status(500).json({ error: 'Internal proxy error' });
  }
}
