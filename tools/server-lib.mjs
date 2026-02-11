import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DIST_ROUTE_MAP, SOURCE_ROUTE_MAP } from './path-map.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

function contentType(filePath) {
  return MIME[path.extname(filePath)] || 'application/octet-stream';
}

function mapSourceFile(urlPathname) {
  if (SOURCE_ROUTE_MAP[urlPathname]) {
    return SOURCE_ROUTE_MAP[urlPathname];
  }

  if (urlPathname.startsWith('/styles/')) {
    return `src${urlPathname}`;
  }
  if (urlPathname.startsWith('/scripts/')) {
    return `src${urlPathname}`;
  }
  if (urlPathname.startsWith('/assets/')) {
    return `src${urlPathname}`;
  }
  if (urlPathname.startsWith('/locales/')) {
    return `src${urlPathname}`;
  }
  if (urlPathname.startsWith('/workers/')) {
    return `src${urlPathname}`;
  }
  if (urlPathname.startsWith('/icons/')) {
    return `public${urlPathname}`;
  }
  if (urlPathname === '/manifest.json') {
    return 'public/manifest.json';
  }

  return null;
}

function mapDistFile(urlPathname) {
  if (DIST_ROUTE_MAP[urlPathname]) {
    return DIST_ROUTE_MAP[urlPathname];
  }

  if (urlPathname.startsWith('/styles/')) {
    return `dist${urlPathname}`;
  }
  if (urlPathname.startsWith('/scripts/')) {
    return `dist${urlPathname}`;
  }
  if (urlPathname.startsWith('/assets/')) {
    return `dist${urlPathname}`;
  }
  if (urlPathname.startsWith('/locales/')) {
    return `dist${urlPathname}`;
  }
  if (urlPathname.startsWith('/workers/')) {
    return `dist${urlPathname}`;
  }
  if (urlPathname.startsWith('/icons/')) {
    return `dist${urlPathname}`;
  }
  if (urlPathname === '/manifest.json') {
    return 'dist/manifest.json';
  }

  return null;
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function handleFunctionStub(request, response, pathname) {
  if (pathname === '/functions/v1/validate-whatsapp' && request.method === 'POST') {
    return parseBody(request)
      .then((body) => {
        const payload = JSON.parse(body || '{}');
        const phone = String(payload.phone || '');
        const valid = /^\+20\d{10}$/.test(phone);
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ valid, wa_id: valid ? phone.replace('+', '') : null, source: 'dev_stub' }));
      })
      .catch(() => {
        response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ valid: false, wa_id: null, source: 'dev_stub' }));
      });
  }

  response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({ error: 'not_found' }));
  return Promise.resolve();
}

export function startServer({ mode = 'src', port = 3000 } = {}) {
  const server = createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith('/functions/v1/')) {
      handleFunctionStub(request, response, pathname);
      return;
    }

    const mapped = mode === 'dist' ? mapDistFile(pathname) : mapSourceFile(pathname);
    if (!mapped) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not Found');
      return;
    }

    const absolute = path.resolve(process.cwd(), mapped);
    if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not Found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentType(absolute),
      'Cache-Control': mode === 'dist' ? 'public, max-age=120' : 'no-store',
    });

    fs.createReadStream(absolute).pipe(response);
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve({ server, port });
    });
  });
}
