// Service Worker for Caching Map Tiles (Melktoday V2)
const TILE_CACHE_NAME = 'melktoday-map-tiles-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== TILE_CACHE_NAME && key.startsWith('melktoday-map-tiles')) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Only intercept OpenStreetMap tile requests
    if (url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.open(TILE_CACHE_NAME).then(async (cache) => {
                // 1. Cache First: Return immediately if available locally
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                // 2. Network Fallback: Fetch from server and store in cache
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch {
                    // Return cached response if available, or empty placeholder
                    return cachedResponse || new Response(null, { status: 504, statusText: 'Tile Unavailable' });
                }
            })
        );
    }
});
