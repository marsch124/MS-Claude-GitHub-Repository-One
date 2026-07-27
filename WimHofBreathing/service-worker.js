// service-worker.js — offline-capable AND self-updating.
//
// No manual version bumping. App files use a "network-first" strategy: when you
// have a connection the app always loads the newest version from the server and
// quietly refreshes its offline copy; when you're offline it falls back to that
// saved copy. So new deploys appear on the next launch, automatically.
const CACHE = 'wim-hof-breathing';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch the latest from the network (with a short timeout so a flaky connection
// never hangs the app), update the offline copy, and fall back to the cache when
// offline. Navigations fall back to the cached app shell.
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== location.origin) return; // let cross-origin pass through

  e.respondWith((async () => {
    try {
      const fresh = await fetchWithTimeout(request, 3500);
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw err;
    }
  })());
});

function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}
