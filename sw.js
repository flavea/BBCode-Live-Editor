var cacheName = 'bbcode-editor';
var filesToCache = [
  '/',
  '/index.html',
  '/css/fa.css',
  '/css/fonts.css',
  '/css/style.less',
  '/scripts/less.min.js',
  '/scripts/parser.js',
  '/scripts/editor.js',
  '/scripts/modal.js',
  '/scripts/theme.js',
  '/icons/icon-128x128.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-512x512.png',
  '/webfonts/fa-solid-900.eot',
  '/webfonts/fa-solid-900.svg',
  '/webfonts/fa-solid-900.ttf',
  '/webfonts/fa-solid-900.woff',
  '/webfonts/fa-solid-900.woff2'
];

self.addEventListener('install', async event => {
  const cache = await caches.open(cacheName + '-static-cache');
  cache.addAll(filesToCache);
});

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin === location.url) {
    event.respondWith(cacheFirst(req));
  } else {
    event.respondWith(networkFirst(req));
  }
});

async function cacheFirst(req) {
  const cachedResponse = caches.match(req);
  return cachedResponse || fetch(req);
}

async function networkFirst(req) {
  const cache = await caches.open(cacheName + '-dynamic-cache');

  try {
    const res = await fetch(req);
    if (req.url.indexOf('http') !== 0) cache.put(req, res.clone());
    return res;
  } catch (error) {
    return await cache.match(req);
  }
}

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});