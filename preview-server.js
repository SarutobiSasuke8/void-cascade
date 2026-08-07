const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const HOST = '127.0.0.1';
const portArg = process.argv.find(arg => arg.startsWith('--port='));
const PORT = portArg ? Number(portArg.slice('--port='.length)) : 4173;

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store, max-age=0'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${HOST}:${PORT}`).pathname);
  } catch {
    send(res, 400, 'Bad request');
    return;
  }

  if (pathname === '/') pathname = '/play/';
  let filePath = path.resolve(ROOT, `.${pathname}`);
  const insideRoot = filePath === ROOT || filePath.startsWith(ROOT + path.sep);
  if (!insideRoot) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    if (!statError && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        send(res, readError.code === 'ENOENT' ? 404 : 500, 'Not found');
        return;
      }
      send(res, 200, data, MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
    });
  });
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.log(`VOID CASCADE preview is already available at http://${HOST}:${PORT}/play/`);
    process.exit(0);
  }
  throw error;
});

server.listen(PORT, HOST, () => {
  console.log(`VOID CASCADE preview: http://${HOST}:${PORT}/play/`);
  console.log('Press Ctrl+C to stop.');
});
