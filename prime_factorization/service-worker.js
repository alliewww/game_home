const CACHE_NAME = 'pf-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  // 注意：外部 CDN 檔案會以網路優先策略存取
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 網路優先，若失敗再回快取
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 可選擇把新的回應放進快取
        return response;
      })
      .catch(() => caches.match(event.request))
  );
}); 