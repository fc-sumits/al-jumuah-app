const CACHE_VERSION = 'aljumuah-v3';
const SHELL_CACHE = CACHE_VERSION + '-shell';
const CONTENT_CACHE = CACHE_VERSION + '-content';
const IMAGE_CACHE = CACHE_VERSION + '-images';
const AUDIO_CACHE = 'quran-audio-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './content/taharah-salah.json',
  './content/salah.json',
  './content/jumuah.json',
  './content/prophets-1.json', 
  './content/prophets-2.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Precache partial failure', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = [SHELL_CACHE, CONTENT_CACHE, IMAGE_CACHE, AUDIO_CACHE];
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (!keep.includes(name) && name.startsWith('aljumuah-')) {
            return caches.delete(name);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin && url.origin !== 'https://everyayah.com') {
    return;
  }

  if (url.pathname.includes('/content/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.open(CONTENT_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req).then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  if (url.pathname.includes('/images/') || url.pathname.endsWith('.webp') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  if (url.hostname === 'everyayah.com') {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(req).then((cached) => cached || fetch(req))
      )
    );
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res && res.ok && url.origin === self.location.origin) {
          cache.put(req, res.clone());
        }
        return res;
      }))
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
