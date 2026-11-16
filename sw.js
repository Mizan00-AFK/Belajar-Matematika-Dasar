const CACHE_NAME = 'bintang-matematika-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/audio.js',
    '/js/confetti.js',
    '/js/scratchpad.js',
    '/js/generator.js',
    '/js/storage.js',
    '/js/app.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event - cache each asset individually so one failure doesn't break all
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            const results = await Promise.allSettled(
                ASSETS_TO_CACHE.map(url =>
                    cache.add(url).catch(err => {
                        console.warn('[SW] Failed to cache:', url, err);
                    })
                )
            );
            console.log('[SW] Cache install complete:', results.filter(r => r.status === 'fulfilled').length, '/', ASSETS_TO_CACHE.length, 'assets cached');
            return self.skipWaiting();
        })
    );
});

// Activate event - cleanup old caches and claim clients immediately
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Activated, claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch event - cache first, then network, fallback to index.html for navigation
self.addEventListener('fetch', (e) => {
    // Only handle GET requests
    if (e.request.method !== 'GET') return;

    // Skip cross-origin requests
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Serve from cache, also refresh in background (stale-while-revalidate)
                const networkFetch = fetch(e.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(e.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => { /* background refresh failed, cached version already served */ });

                return cachedResponse;
            }

            // Not in cache - fetch from network
            return fetch(e.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // Offline fallback: return index.html for navigation requests
                if (e.request.mode === 'navigate') {
                    return caches.match('/index.html').then(r => r || caches.match('/'));
                }
                // For other assets, return a minimal offline response
                return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            });
        })
    );
});
