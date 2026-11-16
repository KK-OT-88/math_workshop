const https = require('https');

const ALLOWED_LANGS = new Set(['th', 'en']);

exports.handler = async function (event) {
  const params = event.queryStringParameters || {};
  const q = params.q;
  const tl = params.tl;

  if (!q || !tl) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'กรุณาระบุข้อความ (q) และภาษา (tl) ที่ต้องการ' })
    };
  }

  if (!ALLOWED_LANGS.has(tl)) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'รองรับเฉพาะภาษา th และ en เท่านั้น' })
    };
  }

  if (q.length > 200) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'ความยาวของข้อความ (q) ต้องไม่เกิน 200 ตัวอักษร' })
    };
  }

  const encodedQ = encodeURIComponent(q);
  const encodedTl = encodeURIComponent(tl);
  const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedQ}&tl=${encodedTl}&client=tw-ob`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };

  try {
    const audioBuffer = await new Promise((resolve, reject) => {
      const googleReq = https.get(targetUrl, options, (googleRes) => {
        if (googleRes.statusCode === 200) {
          const chunks = [];
          googleRes.on('data', (chunk) => chunks.push(chunk));
          googleRes.on('end', () => resolve(Buffer.concat(chunks)));
          googleRes.on('error', (err) => reject(err));
        } else {
          googleRes.resume();
          reject(new Error(`Google Translate TTS API ตอบกลับด้วยรหัส HTTP ${googleRes.statusCode}`));
        }
      });

      googleReq.setTimeout(5000, () => {
        googleReq.destroy(new Error('การเชื่อมต่อกับ Google Translate TTS API หมดเวลา'));
      });

      googleReq.on('error', (err) => {
        reject(new Error(`ไม่สามารถเชื่อมต่อกับ Google Translate TTS API ได้: ${err.message}`));
      });
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      },
      body: audioBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
