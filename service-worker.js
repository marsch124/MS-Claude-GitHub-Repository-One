/* Triathlon Glossary — offline cache.
 * Bump CACHE when you change any cached file so phones pick up the update. */
var CACHE = 'tri-glossary-v1';
var ASSETS = [
  '.',
  'index.html',
  'styles.css',
  'js/terms.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (resp) {
        // Cache same-origin GETs as we go, so new assets get stored too.
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
        }
        return resp;
      }).catch(function () {
        // Offline and not cached: fall back to the app shell for navigations.
        if (event.request.mode === 'navigate') return caches.match('index.html');
      });
    })
  );
});
