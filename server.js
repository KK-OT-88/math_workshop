const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleTtsRequest } = require('./tts-handler');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

function createAppServer(publicDir = PUBLIC_DIR) {
  return http.createServer((req, res) => {
    const rawPath = (req.url || '/').split('?')[0].split('#')[0];
    let decodedRawPath;
    try {
      decodedRawPath = decodeURIComponent(rawPath);
    } catch (_) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('400 Bad Request');
      return;
    }

    if (decodedRawPath.split(/[\\/]+/).includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    const host = req.headers.host || 'localhost';
    const protocol = req.socket && req.socket.encrypted ? 'https' : 'http';
    const parsedUrl = new URL(req.url, `${protocol}://${host}`);
    const pathnameOnly = parsedUrl.pathname;

    if (pathnameOnly === '/api/health' || pathnameOnly === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'OK', uptime: process.uptime() }));
      return;
    }

    if (pathnameOnly === '/api/tts' || pathnameOnly.startsWith('/api/tts/')) {
      return handleTtsRequest(req, res);
    }

    // Prevent directory traversal outside publicDir
    const trimmedPath = decodedRawPath.replace(/^\/+/, '');
    let filePath = path.resolve(publicDir, trimmedPath || 'index.html');
    const resolvedPublic = path.resolve(publicDir);
    const rel = path.relative(resolvedPublic, filePath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`500 Internal Server Error: ${err.code}`);
        }
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.end(content);
      }
    });
  });
}

if (require.main === module) {
  const server = createAppServer();
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server.');
  });
}

module.exports = { createAppServer };
