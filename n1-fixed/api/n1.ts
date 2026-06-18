import type { VercelRequest, VercelResponse } from '@vercel/node';

const N1_BASE = 'https://api.n1.xyz';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = (req.query.path as string) || '';
  const params = new URLSearchParams();
  Object.entries(req.query).forEach(([k, v]) => {
    if (k !== 'path' && v) params.set(k, String(v));
  });
  const qs = params.toString();
  const url = `${N1_BASE}${path.startsWith('/') ? path : '/' + path}${qs ? '?' + qs : ''}`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}