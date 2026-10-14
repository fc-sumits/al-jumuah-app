const CACHE_VERSION = 'aljumuah-v25';
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
  './content/prophets-2.json',
  './content/prophets-3.json',
  './content/prophets-4.json',
  './content/prophets-5.json',
  './images/prophet-01-adam.webp',
'./images/prophet-02-idris.webp',
'./images/prophet-03-nuh.webp',
'./images/prophet-04-hud.webp',
'./images/prophet-05-salih.webp',
'./images/prophet-06-ibrahim.webp',
'./images/prophet-07-lut.webp',
'./images/prophet-08-ismail.webp',
'./images/prophet-09-ishaq.webp',
'./images/prophet-10-yaqub.webp',
'./images/prophet-11-yusuf.webp',
'./images/prophet-12-ayyub.webp',
'./images/prophet-13-shuayb.webp',
'./images/prophet-14-musa.webp',
'./images/prophet-15-harun.webp',
'./images/prophet-16-dhulkifl.webp',
'./images/prophet-17-dawud.webp',
'./images/prophet-18-sulayman.webp',
'./images/prophet-19-ilyas.webp',
'./images/prophet-20-alyasa.webp',
'./images/prophet-21-yunus.webp',
'./images/prophet-22-zakariyya.webp',
'./images/prophet-23-yahya.webp',
'./images/prophet-24-isa.webp',
'./images/prophet-25-muhammad.webp',
'./content/new-muslim.json',
  './images/new-muslim-hero.webp',
    './content/seerah.json',
  './images/seerah-phase-1.webp',
  './images/seerah-phase-2.webp',
  './images/seerah-phase-3.webp',
  './images/seerah-phase-4.webp',
  './images/seerah-phase-5.webp',
  './images/seerah-feat-first-revelation.webp',
  './images/seerah-feat-isra-miraj.webp',
  './images/seerah-feat-hijrah.webp',
  './images/seerah-feat-badr.webp',
  './images/seerah-feat-uhud.webp',
  './images/seerah-feat-trench.webp',
  './images/seerah-feat-hudaybiyyah.webp',
  './images/seerah-feat-conquest.webp',
  './images/seerah-feat-farewell.webp',
  './images/seerah-feat-passing.webp',
  './images/seerah-closing.webp',
    './content/sahaba-1.json',
  './content/sahaba-2.json',
  './content/sahaba-3.json',
  './content/sahaba-4.json',
  './content/sahaba-5.json',
  './images/sahaba-hero.webp',
  './images/sahaba-01-abu-bakr.webp',
  './images/sahaba-02-umar.webp',
  './images/sahaba-03-uthman.webp',
  './images/sahaba-04-ali.webp',
  './images/sahaba-05-bilal.webp',
  './images/sahaba-06-hamza.webp',
  './images/sahaba-07-khalid.webp',
  './images/sahaba-08-salman.webp',
  './images/sahaba-09-abu-hurayrah.webp',
  './images/sahaba-10-aisha.webp',
  './images/sahaba-11-fatimah.webp',
  './images/sahaba-12-zayd.webp',
  './images/sahaba-13-sad.webp',
  './images/sahaba-14-talha.webp',
  './images/sahaba-15-zubayr.webp',
  './content/quiz.json'
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
