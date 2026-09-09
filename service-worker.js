const CACHE_NAME = 'faceauth-w6w-v1';
const APP_SHELL = [
  './face-auth-demo.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // هرگز درخواست‌های API را کش نکن — این‌ها به کوکی سشن تازه نیاز دارند
  if (url.pathname.startsWith('/api/')) return;

  // فقط فایل‌های خود اپ را کش کن؛ CDNها (face-api.js, xlsx.js, فونت‌ها, مدل‌ها) دست‌نخورده می‌مانند
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
