/* Service worker de GoogleDork.
   - Navegaciones (HTML): network-first, con fallback a cache si no hay red.
     Asi un deploy nuevo nunca deja la pagina en blanco por HTML/assets viejos.
   - Assets hasheados (/assets/): cache-first (son inmutables).
   - Resto del origen: stale-while-revalidate. */
const CACHE_NAME = 'googledork-v2'
const BASE_PATH = new URL(self.registration.scope).pathname

const PRECACHE = [`${BASE_PATH}manifest.webmanifest`, `${BASE_PATH}favicon.svg`]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navegaciones: network-first. Si falla la red, cae al cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          return cached ?? (await caches.match(BASE_PATH)) ?? Response.error()
        }),
    )
    return
  }

  // Assets hasheados (inmutables): cache-first.
  if (url.pathname.startsWith(`${BASE_PATH}assets/`)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
      }),
    )
    return
  }

  // Resto del origen: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached ?? network
    }),
  )
})
