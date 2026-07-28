/* AMS Triathlon Glossary — offline service worker.
 * Network-first for the page so a fresh upload always shows when online,
 * falling back to the cached copy when there is no connection. */
var CACHE = 'ams-tri-glossary-v1';
var SHELL = ['./', 'index.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  // The app is a single HTML document: keep it fresh online, available offline.
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put('index.html', copy); });
        return resp;
      }).catch(function () {
        return caches.match('index.html').then(function (r) { return r || caches.match('./'); });
      })
    );
    return;
  }

  // Anything else: serve from cache if present, otherwise fetch.
  e.respondWith(caches.match(req).then(function (r) { return r || fetch(req); }));
});
