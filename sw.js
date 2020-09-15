importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js')

const v = 'v2'
const cached = {
  prefetch: 'bbcode-' + v
}
const filesToCache = [
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
  '/webfonts/fa-solid-900.eot',
  '/webfonts/fa-solid-900.svg',
  '/webfonts/fa-solid-900.ttf',
  '/webfonts/fa-solid-900.woff',
  '/webfonts/fa-solid-900.woff2',
  'https://cdn.jsdelivr.net/g/filesaver.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.9/mammoth.browser.min.js'
]

workbox.routing.registerRoute(
  new RegExp('.*\.js'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'js-cache',
  })
)

workbox.routing.registerRoute(
  /\.css$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'css-cache',
  })
)

workbox.routing.registerRoute(
  /\.(?:png|woff2|svg|eot|ttf|woff)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'image-font-cache',
  })
)

workbox.precaching.precacheAndRoute(filesToCache)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cached.prefetch).then((cache) => {
      filesToCache.map((urlToPrefetch) => {
        let url = new URL(urlToPrefetch, location.href)

        url.search += (url.search ? '&' : '?') + 'cache-bust=' + Date.now()

        const request = new Request(url, {
          mode: 'no-cors'
        })

        return fetch(request).then((response) => {
          if (response.status >= 400) {
            throw new Error(urlToPrefetch + ': ' + response.statusText)
          }

          return cache.put(urlToPrefetch, response)
        }).catch((error) => {
          console.error(error)
        })
      })
    }).catch((error) => {
      console.error(error)
    })
  )
})

self.addEventListener('activate', (event) => {
  const expectedCacheNames = Object.keys(cached).map((key) => cached[key])

  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (expectedCacheNames.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    )
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request).then((response) => response).catch((error) => {
        console.error('Fail:', error)
        throw error
      })
    })
  )
})