import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.MEDEO_DEMO_PORT || 4173);

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const relative = normalize(pathname).replace(/^[/\\]+/, '');
  let target = join(root, relative || 'index.html');

  if (!target.startsWith(root) || !existsSync(target)) target = join(root, 'index.html');
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': types[extname(target)] || 'application/octet-stream'
  });
  createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Medeo Pro demo: http://127.0.0.1:${port}`);
});
