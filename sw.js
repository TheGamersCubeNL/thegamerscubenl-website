// TheGamersCubeNL Service Worker
const CACHE_NAME = 'tgcnl-v1';
const STATIC_ASSETS = [
  '/thegamerscubenl-website/',
  '/thegamerscubenl-website/index.html',
  '/thegamerscubenl-website/manifest.json',
  '/thegamerscubenl-website/icons/icon-192.png',
  '/thegamerscubenl-website/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase, Google APIs, Twitch (always need fresh data)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('twitch') ||
    url.hostname.includes('youtube') ||
    url.hostname.includes('firestore')
  ) {
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    }).catch(() => {
      // Offline fallback
      if (event.request.destination === 'document') {
        return caches.match('/thegamerscubenl-website/index.html');
      }
    })
  );
});

// Push notifications (voor toekomstige stream alerts)
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'TheGamersCubeNL', {
    body: data.body || 'Check de stream!',
    icon: '/thegamerscubenl-website/icons/icon-192.png',
    badge: '/thegamerscubenl-website/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/thegamerscubenl-website/' }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
