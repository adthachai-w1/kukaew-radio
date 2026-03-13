// api/stream.ts — Vercel Edge Function with full error visibility

export const config = {
  runtime: 'edge',
};

const UPSTREAM =
  'http://uk5freenew.listen2myradio.com/live.mp3?typeportmount=s1_13082_stream_697042847';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // ─── /api/stream?debug=1  →  แสดง error JSON ─────────────────────────────
  const debug = url.searchParams.get('debug') === '1';

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  // ── ลอง fetch upstream และดัก error ทุกกรณี ────────────────────────────────
  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioProxy/3.0)',
        'Accept': 'audio/mpeg, audio/*, */*',
        ...(req.headers.get('icy-metadata') ? { 'Icy-MetaData': '1' } : {}),
      },
      redirect: 'follow',
    });
  } catch (err: any) {
    // fetch ล้มเหลวทั้งหมด (network error, DNS fail, HTTP บล็อก ฯลฯ)
    const detail = {
      stage: 'fetch_upstream',
      error: err?.message ?? String(err),
      upstream_url: UPSTREAM,
      hint: 'Vercel Edge อาจบล็อก outbound HTTP — ลองเปลี่ยน upstream เป็น HTTPS',
    };
    console.error('[stream] fetch error:', detail);
    return new Response(JSON.stringify(detail, null, 2), {
      status: 502,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  // ── upstream ตอบกลับแต่ status ไม่ดี ────────────────────────────────────────
  if (!upstream.ok) {
    const body = await upstream.text().catch(() => '');
    const detail = {
      stage: 'upstream_response',
      status: upstream.status,
      statusText: upstream.statusText,
      body: body.slice(0, 300),
      upstream_url: UPSTREAM,
    };
    console.error('[stream] bad upstream status:', detail);
    return new Response(JSON.stringify(detail, null, 2), {
      status: 502,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  // ── upstream body เป็น null (ไม่มี stream) ─────────────────────────────────
  if (!upstream.body) {
    return new Response(
      JSON.stringify({ error: 'upstream.body is null — no stream data' }),
      { status: 502, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  }

  // ── ✅ ทุกอย่างโอเค — relay stream ──────────────────────────────────────────
  const resHeaders = new Headers(corsHeaders());
  resHeaders.set('Content-Type', upstream.headers.get('content-type') ?? 'audio/mpeg');
  resHeaders.set('Cache-Control', 'no-cache, no-store');
  resHeaders.set('X-Accel-Buffering', 'no');

  for (const h of ['icy-name','icy-genre','icy-url','icy-br','icy-sr','icy-metaint']) {
    const v = upstream.headers.get(h);
    if (v) resHeaders.set(h, v);
  }

  return new Response(upstream.body, { status: 200, headers: resHeaders });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
  };
}
