const CACHE_NAME = '3d-pricer-pro-v2';

const urlsToCache = [
  '/3d-pricer-pro/',
  '/3d-pricer-pro/index.html',
  '/3d-pricer-pro/style.css',
  '/3d-pricer-pro/style-extra.css',
  '/3d-pricer-pro/app.js',
  '/3d-pricer-pro/simulator.js',
  '/3d-pricer-pro/dashboard.js',
  '/3d-pricer-pro/clients.js',
  '/3d-pricer-pro/catalog.js',
  '/3d-pricer-pro/tools.js',
  '/3d-pricer-pro/suggestions.js',
  '/3d-pricer-pro/export.js',
  '/3d-pricer-pro/manifest.json',
  '/3d-pricer-pro/icon.svg',         // ✅ raiz do projeto
  '/3d-pricer-pro/icons/icon-192.png',
  '/3d-pricer-pro/icons/icon-512.png',
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto, adicionando URLs...');
        // addAll individual para identificar qual falha
        return Promise.allSettled(
          urlsToCache.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[SW] Falha ao cachear: ${url}`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Ativando...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => {
              console.log('[SW] Removendo cache antigo:', k);
              return caches.delete(k);
            })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        console.warn('[SW] Offline e sem cache:', event.request.url);
      });
    })
  );
});
