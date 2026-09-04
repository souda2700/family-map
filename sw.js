const CACHE_NAME = 'trail-app-v9';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// インストール処理
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // 即座に新しいSWを有効化
  );
});

// アクティベート処理（古いキャッシュの自動削除）
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cache);
            return caches.delete(cache); // 古いキャッシュを全消去
          }
        })
      );
    }).then(() => self.clients.claim()) // すぐに制御を開始
  );
});

// フェッチ処理
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});