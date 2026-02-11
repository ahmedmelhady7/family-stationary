const VERSION = 'v1';
const SHELL_CACHE = `fs-shell-${VERSION}`;
const IMAGE_CACHE = `fs-images-${VERSION}`;
const API_CACHE = `fs-api-${VERSION}`;
const FONT_CACHE = `fs-fonts-${VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/products.html',
  '/product.html',
  '/cart.html',
  '/checkout.html',
  '/order-confirmation.html',
  '/offline.html',
  '/styles/main.css',
  '/scripts/app-shell.js',
  '/manifest.json',
  '/assets/icons/lantern.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => ![SHELL_CACHE, IMAGE_CACHE, API_CACHE, FONT_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (_error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw _error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (url.pathname.startsWith('/locales/') || url.pathname.startsWith('/assets/fonts/')) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  if (url.pathname.startsWith('/functions/') || url.pathname.startsWith('/rest/')) {
    event.respondWith(
      networkFirst(request, API_CACHE).catch(() => {
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );
    return;
  }

  event.respondWith(
    networkFirst(request, SHELL_CACHE).catch(async () => {
      const cache = await caches.open(SHELL_CACHE);
      return cache.match('/offline.html');
    }),
  );
});
