const https = require('https');

const ALLOWED_LANGS = new Set(['th', 'en']);

function handleTtsRequest(req, res) {
  const host = req.headers.host || 'localhost';
  const protocol = req.socket && req.socket.encrypted ? 'https' : 'http';
  const parsedUrl = new URL(req.url, `${protocol}://${host}`);
  const q = parsedUrl.searchParams.get('q');
  const tl = parsedUrl.searchParams.get('tl');

  if (!q || !tl) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'กรุณาระบุข้อความ (q) และภาษา (tl) ที่ต้องการ' }));
    return;
  }

  if (!ALLOWED_LANGS.has(tl)) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'รองรับเฉพาะภาษา th และ en เท่านั้น' }));
    return;
  }

  if (q.length > 200) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'ความยาวของข้อความ (q) ต้องไม่เกิน 200 ตัวอักษร' }));
    return;
  }

  const encodedQ = encodeURIComponent(q);
  const encodedTl = encodeURIComponent(tl);
  const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedQ}&tl=${encodedTl}&client=tw-ob`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };

  const googleReq = https.get(targetUrl, options, (googleRes) => {
    if (googleRes.statusCode === 200) {
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      });
      googleRes.pipe(res);
    } else {
      googleRes.resume();
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: `Google Translate TTS API ตอบกลับด้วยรหัส HTTP ${googleRes.statusCode}` }));
    }
  });

  googleReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: `ไม่สามารถเชื่อมต่อกับ Google Translate TTS API ได้: ${err.message}` }));
    }
  });

  req.on('close', () => {
    if (!googleReq.destroyed) {
      googleReq.destroy();
    }
  });
}

module.exports = { handleTtsRequest, ALLOWED_LANGS };
