// api/cdn-proxy.js
// Vercel Serverless Function: proxies media from cdn.exercisedb.dev
// This adds the required CORP header so the media loads under COEP in dev/prod.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // The path after /api/cdn-proxy/ is the CDN path
  const cdnPath = req.url.replace(/^\/?api\/cdn-proxy\/?/, '');
  if (!cdnPath) {
    return res.status(400).json({ error: 'Missing CDN path' });
  }

  const targetUrl = `https://cdn.exercisedb.dev/${cdnPath}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `CDN error ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('[cdn-proxy] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
