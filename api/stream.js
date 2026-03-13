export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // ลอง URL หลายแบบ
  const urls = [
    'https://uk5freenew.listen2myradio.com/live.mp3?typeportmount=s1_13082_stream_697042847',
    'https://uk5freenew.listen2myradio.com:7046/;',
  ];

  for (const streamUrl of urls) {
    try {
      const response = await fetch(streamUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Referer': 'https://listen2myradio.com/',
          'Origin': 'https://listen2myradio.com',
          'Accept': '*/*',
        },
      });

      if (response.ok) {
        return new Response(response.body, {
          status: 200,
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked',
          },
        });
      }

      console.log(`URL ${streamUrl} returned ${response.status}`);

    } catch (err) {
      console.log(`URL ${streamUrl} failed: ${err.message}`);
    }
  }

  // ทุก URL ล้มเหลว
  return new Response(JSON.stringify({ error: 'Stream unavailable', urls_tried: urls }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}
