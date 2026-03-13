import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';
import http from 'http';

const UPSTREAM =
  'http://uk5freenew.listen2myradio.com/live.mp3?typeportmount=s1_13082_stream_697042847';

export const config = {
  api: {
    responseLimit: false,   // ปิด limit — stream ต้องไหลต่อเนื่อง
    bodyParser: false,
  },
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    return res.status(204).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('X-Accel-Buffering', 'no');

  fetchStream(UPSTREAM, req, res, 0);
}

function fetchStream(
  url: string,
  req: VercelRequest,
  res: VercelResponse,
  redirectCount: number
) {
  if (redirectCount > 5) {
    return res.status(502).json({ error: 'Too many redirects' });
  }

  const parsed = new URL(url);
  const lib = parsed.protocol === 'https:' ? https : http;

  const options: http.RequestOptions = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RadioProxy/2.0)',
      'Accept': 'audio/mpeg, audio/*, */*',
      'Connection': 'keep-alive',
      ...(req.headers['icy-metadata'] ? { 'Icy-MetaData': '1' } : {}),
    },
  };

  const proxyReq = lib.request(options, (upstream) => {
    const status = upstream.statusCode ?? 0;

    // ติดตาม redirect
    if ([301, 302, 307, 308].includes(status)) {
      const location = upstream.headers['location'];
      upstream.destroy();
      if (!location) return res.status(502).json({ error: 'Redirect with no location' });
      return fetchStream(location, req, res, redirectCount + 1);
    }

    if (status < 200 || status >= 300) {
      upstream.destroy();
      return res.status(502).json({ error: `Upstream status ${status}` });
    }

    // ส่ง headers ที่จำเป็นต่อ client
    const pass = [
      'content-type',
      'content-length',
      'accept-ranges',
      'transfer-encoding',
      'icy-name',
      'icy-genre',
      'icy-url',
      'icy-br',
      'icy-sr',
      'icy-metaint',
    ];

    // Force audio/mpeg ถ้า upstream ไม่ส่ง content-type
    res.setHeader('Content-Type', upstream.headers['content-type'] ?? 'audio/mpeg');

    pass.forEach((h) => {
      const v = upstream.headers[h];
      if (v) res.setHeader(h, v);
    });

    res.status(200);
    upstream.pipe(res);

    req.on('close', () => upstream.destroy());
    req.on('aborted', () => upstream.destroy());
  });

  proxyReq.on('error', (err) => {
    console.error('[proxy error]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', detail: err.message });
    }
  });

  proxyReq.end();
}
