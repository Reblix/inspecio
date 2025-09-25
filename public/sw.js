// public/sw.js
const CACHE_NAME = 'inspecio-v1';
const OFFLINE_URLS = [
  '/', 
  '/index.html',
  '/styles.css',
  // adicione aqui outros assets críticos (logos, ícones, fontes)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // network-first para HTML, cache-first para estáticos
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
  } else {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
