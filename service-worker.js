// service-worker.js
const CACHE_NAME = '3d-pricer-pro-cache-v1'; // Nome do cache, mude a versão se alterar os arquivos cacheados
const urlsToCache = [
  '/3d-pricer-pro/', // A raiz do seu projeto no GitHub Pages
  '/3d-pricer-pro/index.html',
  '/3d-pricer-pro/style.css',
  '/3d-pricer-pro/style-extra.css',
  '/3d-pricer-pro/app.js',
  '/3d-pricer-pro/tools.js',
  '/3d-pricer-pro/simulator.js',
  '/3d-pricer-pro/dashboard.js',
  '/3d-pricer-pro/clients.js',
  '/3d-pricer-pro/catalog.js',
  '/3d-pricer-pro/suggestions.js',
  '/3d-pricer-pro/export.js',
  '/3d-pricer-pro/manifest.json',
  '/3d-pricer-pro/icons/icon-192.png', // Exemplo de ícone, adicione todos os seus ícones
  '/3d-pricer-pro/icons/icon-512.png',
  '/3d-pricer-pro/icons/icon.svg',
  // Adicione aqui todos os outros arquivos estáticos (imagens, fontes, etc.)
  // que você quer que funcionem offline.
  // Não inclua scripts externos que não podem ser cacheados (como o jspdf da CDN)
];

// Evento 'install': Instala o Service Worker e cacheia os recursos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, adicionando URLs...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Força o novo SW a ativar imediatamente
      .catch((error) => {
        console.error('[SW] Falha ao cachear URLs:', error);
      })
  );
});

// Evento 'activate': Ativa o Service Worker e limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Garante que o Service Worker controla a página imediatamente
  event.waitUntil(clients.claim());
});

// Evento 'fetch': Intercepta requisições de rede e serve do cache se disponível
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET ou para recursos de outros domínios
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se o recurso está no cache, retorna-o
        if (response) {
          return response;
        }
        // Caso contrário, busca na rede
        return fetch(event.request)
          .then((networkResponse) => {
            // Opcional: Cachear novas requisições em tempo de execução
            // return caches.open(CACHE_NAME).then((cache) => {
            //   cache.put(event.request, networkResponse.clone());
            //   return networkResponse;
            // });
            return networkResponse;
          })
          .catch(() => {
            // Fallback para quando a rede e o cache falham (ex: página offline)
            // Você pode retornar uma página offline personalizada aqui
            console.log('[SW] Falha na requisição e não encontrado no cache:', event.request.url);
            // return caches.match('/3d-pricer-pro/offline.html'); // Exemplo de página offline
          });
      })
  );
});
