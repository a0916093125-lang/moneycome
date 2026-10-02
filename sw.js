const CACHE_NAME = 'tt-pwa-cache-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // 基礎 PWA 攔截，確保符合安裝資格
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});