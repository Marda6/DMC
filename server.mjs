// Tiny zero-dependency static server for the prototype (local preview only).
// GitHub Pages serves the files directly and does NOT need this.
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4321;
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
  '.mjs':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg',
  '.svg':'image/svg+xml', '.json':'application/json', '.woff2':'font/woff2', '.webp':'image/webp' };

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (p === '' || p.endsWith('/')) p += p ? 'index.html' : '/index.html';
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const buf = await readFile(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(buf);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => console.log(`Prototype on http://localhost:${PORT}`));
