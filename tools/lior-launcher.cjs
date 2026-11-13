'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = 4182;
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/character-catalog.js', ['character-catalog.js', 'text/javascript; charset=utf-8']],
  ['/character-engine.js', ['character-engine.js', 'text/javascript; charset=utf-8']],
  ['/character-studio.js', ['character-studio.js', 'text/javascript; charset=utf-8']],
  ['/character-combat.js', ['character-combat.js', 'text/javascript; charset=utf-8']],
  ['/character-studio.css', ['character-studio.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/damage-engine.js', ['damage-engine.js', 'text/javascript; charset=utf-8']],
  ['/damage-calculator.js', ['damage-calculator.js', 'text/javascript; charset=utf-8']],
  ['/damage-calculator.css', ['damage-calculator.css', 'text/css; charset=utf-8']],
  ['/lior.png', ['lior.png', 'image/png']],
  ['/logo.png', ['logo.png', 'image/png']],
  ['/favicon.ico', ['logo.png', 'image/png']]
]);
const server = http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, {Allow: 'GET, HEAD'}); return res.end(); }
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  if (pathname === '/__lior_launcher') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({app:'lior-local-launcher', version:2, root, pid:process.pid}));
  }
  const entry = files.get(pathname);
  if (!entry) { res.writeHead(404); return res.end('No encontrado'); }
  fs.readFile(path.join(root, entry[0]), (error, data) => {
    if (error) { res.writeHead(404); return res.end('Falta un archivo de la ficha'); }
    res.setHeader('Content-Type', entry[1]);
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});
server.on('error', error => { console.error('No se pudo iniciar Lior:', error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1');
