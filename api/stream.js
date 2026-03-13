const UPSTREAM =
  'http://uk5freenew.listen2myradio.com/live.mp3?typeportmount=s1_13082_stream_697042847';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  let upstream;
  try {
    upstream = await fetch(UPSTREAM, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'audio/mpeg, audio/*, */*',
      },
      redirect: 'follow',
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'fetch failed', detail: err.message }),
      { status: 502, headers: { ...cors(), 'Content-Type': 'application/json' } }
    );
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: 'bad upstream', status: upstream.status }),
      { status: 502, headers: { ...cors(), 'Content-Type': 'application/json' } }
    );
  }

  const headers = new Headers(cors());
  headers.set('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
  headers.set('Cache-Control', 'no-cache, no-store');
  headers.set('X-Accel-Buffering', 'no');

  for (const h of ['icy-name','icy-genre','icy-br','icy-metaint']) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new Response(upstream.body, { status: 200, headers });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
  };
}
