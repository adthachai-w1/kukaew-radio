export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const streamUrl = 'https://uk5freenew.listen2myradio.com/live.mp3?typeportmount=s1_13082_stream_697042847';

  const response = await fetch(streamUrl, {
    headers: {
      // แกล้งทำเป็น browser ธรรมดา ไม่ใช่ server
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.listen2myradio.com/',
      'Origin': 'https://www.listen2myradio.com',
    },
  });

  // ส่ง stream กลับไปให้ browser พร้อม CORS header
  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  });
}
