import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';

const port = Number(process.env.PREVIEW_PORT || 4200);
const root = path.resolve('frontend/dist/salud-medicacion-web/browser');
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
    const requested = path.resolve(root, `.${pathname}`);
    if (!requested.startsWith(root)) {
      response.writeHead(403).end('Acceso denegado');
      return;
    }
    let filePath = requested;
    try {
      const info = await stat(filePath);
      if (info.isDirectory()) filePath = path.join(filePath, 'index.html');
    } catch {
      filePath = path.join(root, 'index.html');
    }
    const body = await readFile(filePath);
    response.writeHead(200, { 'content-type': mimeTypes[path.extname(filePath)] || 'application/octet-stream', 'cache-control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600' });
    response.end(body);
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(`No se pudo servir la aplicación: ${error.message}`);
  }
});

server.listen(port, () => console.info(`[WEB] http://localhost:${port}`));
