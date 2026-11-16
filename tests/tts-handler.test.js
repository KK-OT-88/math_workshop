const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createAppServer } = require('../server');

function requestPath(port, reqPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: reqPath, method: 'GET' }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

test('server health, TTS validation, and traversal guard', async (t) => {
  const server = createAppServer(path.join(__dirname, '..'));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();

  const health = await requestPath(port, '/api/health');
  assert.equal(health.status, 200);
  assert.equal(JSON.parse(health.body).status, 'OK');

  const missingQ = await requestPath(port, '/api/tts?tl=th');
  assert.equal(missingQ.status, 400);

  const missingTl = await requestPath(port, '/api/tts?q=test');
  assert.equal(missingTl.status, 400);

  const longQ = 'ก'.repeat(201);
  const tooLong = await requestPath(port, `/api/tts?q=${encodeURIComponent(longQ)}&tl=th`);
  assert.equal(tooLong.status, 400);

  const badLang = await requestPath(port, '/api/tts?q=hello&tl=fr');
  assert.equal(badLang.status, 400);

  const traversal = await requestPath(port, '/../package.json');
  assert.equal(traversal.status, 403);

  const encodedTraversal = await requestPath(port, '/%2e%2e/package.json');
  assert.equal(encodedTraversal.status, 403);

  const indexPage = await requestPath(port, '/index.html');
  assert.equal(indexPage.status, 200);
  assert.ok(indexPage.body.includes('Christmas Edition'));
});

test('all HTML asset/script/link references exist and SVGs are < 3 KB', () => {
  const rootDir = path.join(__dirname, '..');
  const htmlFiles = fs.readdirSync(rootDir).filter((f) => f.endsWith('.html'));
  assert.ok(htmlFiles.includes('index.html'));
  assert.ok(htmlFiles.includes('worksheet_p1_full_static.html'));
  assert.equal(htmlFiles.length, 10);

  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(rootDir, file), 'utf8');
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    for (const ref of refs) {
      if (/^(?:https?:|data:|#)/.test(ref)) continue;
      const target = path.join(rootDir, ref);
      assert.ok(fs.existsSync(target), `Missing target "${ref}" referenced in ${file}`);
    }
  }

  const svgDir = path.join(rootDir, 'assets', 'christmas');
  const svgs = fs.readdirSync(svgDir).filter((f) => f.endsWith('.svg'));
  assert.equal(svgs.length, 9);
  for (const svg of svgs) {
    const stat = fs.statSync(path.join(svgDir, svg));
    assert.ok(stat.size < 3072, `${svg} is ${stat.size} bytes (expected < 3072)`);
  }
});
