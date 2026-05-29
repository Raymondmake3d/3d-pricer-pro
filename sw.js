'use strict';

// ═══════════════════════════════════════════════════════
// SERVICE WORKER — 3D Pricer Pro
// Cache offline completo
// ═══════════════════════════════════════════════════════

const CACHE_NAME    = '3dpricer-v2';
const CACHE_STATIC  = '3dpricer-static-v2';
const CACHE_DYNAMIC = '3dpricer-dynamic-v2';

// Arquivos para cache estático (sempre offline)
const STATIC_FILES = [
  './',
  './index.html',
  './landing.html',
  './style.css',
  './style-extra.css',
  './app.js',
  './suggestions.js',
  './export.js',
  './simulator.js',
  './dashboard.js',
  './clients.js',
  './catalog.js',
  './manifest.json',
  './icons/icon.svg',
];

// CDN externos para cache
const CDN_FILES = [
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

// ═══════════════════════════════════════════════════════
// INSTALL — Cache todos os arquivos estáticos
// ═══════════════════════════════════════════════════════

self.addEventListener('install', event => {
  console.log('[SW] Instalando 3D Pricer Pro v2...');

  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      console.log('[SW] Cacheando arquivos estáticos...');
      return cache.addAll(STATIC_FILES);
    }).then(() => {
      console.log('[SW] Cache estático completo!');
      return self.skipWaiting();
    }).catch(err => {
      console.warn('[SW] Erro no cache estático:', err);
    })
  );
});

// ═══════════════════════════════════════════════════════
// ACTIVATE — Limpa caches antigos
// ═══════════════════════════════════════════════════════

self.addEventListener('activate', event => {
  console.log('[SW] Ativando nova versão...');

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_STATIC && key !== CACHE_DYNAMIC)
          .map(key => {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] Ativo e controlando!');
      return self.clients.claim();
    })
  );
});

// ═══════════════════════════════════════════════════════
// FETCH — Estratégia Cache First + Network Fallback
// ═══════════════════════════════════════════════════════

self.addEventListener('fetch', event => {
  const { request } = event;
  const url         = new URL(request.url);

  // Ignora requisições não-GET
  if (request.method !== 'GET') return;

  // Ignora extensões do Chrome
  if (url.protocol === 'chrome-extension:') return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {

      // ── Cache Hit → retorna do cache ──
      if (cachedResponse) {
        // Atualiza em background (stale-while-revalidate)
        fetchAndCache(request);
        return cachedResponse;
      }

      // ── Cache Miss → busca na rede ──
      return fetchAndCache(request);
    })
  );
});

// ═══════════════════════════════════════════════════════
// HELPER — Fetch + Cache dinâmico
// ═══════════════════════════════════════════════════════

async function fetchAndCache(request) {
  try {
    const response = await fetch(request);

    // Só cacheia respostas válidas
    if (!response || response.status !== 200 || response.type === 'error') {
      return response;
    }

    const responseClone = response.clone();
    const cache         = await caches.open(CACHE_DYNAMIC);
    cache.put(request, responseClone);

    return response;
  } catch (error) {
    // Offline — tenta retornar do cache dinâmico
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback para página principal
    if (request.destination === 'document') {
      return caches.match('/3d-pricer-pro/index.html');
    }

    console.warn('[SW] Sem cache para:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// ═══════════════════════════════════════════════════════
// PUSH NOTIFICATIONS (base para futuro)
// ═══════════════════════════════════════════════════════

self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const opts = {
    body:    data.body    || 'Nova notificação do 3D Pricer Pro',
    icon:    '/3d-pricer-pro/icons/icon-192.png',
    badge:   '/3d-pricer-pro/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data:    { url: data.url || '/3d-pricer-pro/index.html' },
  };

  event.waitUntil(
    self.registration.showNotification('3D Pricer Pro', opts)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// ═══════════════════════════════════════════════════════
// SYNC — Background sync (base para futuro)
// ═══════════════════════════════════════════════════════

self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync executado!');
  }
});

console.log('[SW] Service Worker 3D Pricer Pro carregado!');