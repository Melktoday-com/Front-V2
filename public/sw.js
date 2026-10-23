// Service Worker for Caching Same-Origin Map Tiles (Melktoday V2)
const TILE_CACHE_NAME = 'melktoday-map-tiles-v2';
const MAX_TILE_ENTRIES = 1500;
let putCounter = 0;

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    // Evict old cache versions (e.g. melktoday-map-tiles-v1)
                    if (key !== TILE_CACHE_NAME && key.startsWith('melktoday-map-tiles')) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

async function trimCache(cache, maxEntries) {
    try {
        const keys = await cache.keys();
        if (keys.length > maxEntries) {
            const countToDelete = keys.length - maxEntries;
            for (let i = 0; i < countToDelete; i++) {
                await cache.delete(keys[i]);
            }
        }
    } catch {}
}

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Only intercept GET requests without Range header
    if (req.method !== 'GET' || req.headers.has('range')) {
        return;
    }

    const url = new URL(req.url);

    // Only intercept internal same-origin tile endpoint requests
    if (url.origin === self.location.origin && url.pathname.startsWith('/api/tiles/')) {
        event.respondWith(
            caches.open(TILE_CACHE_NAME).then(async (cache) => {
                // 1. Cache First: Return immediately if available locally in Cache Storage
                const cachedResponse = await cache.match(req);
                if (cachedResponse) {
                    return cachedResponse;
                }

                // 2. Network Fallback: Fetch from internal Next.js tile proxy
                try {
                    const networkResponse = await fetch(req);

                    // Only cache genuine tiles: 200 OK, image content, not a FALLBACK tile, not no-store
                    const isFallback = networkResponse.headers.get('x-tile-cache') === 'FALLBACK';
                    const cacheControl = networkResponse.headers.get('cache-control') || '';
                    if (
                        networkResponse &&
                        networkResponse.status === 200 &&
                        !isFallback &&
                        !cacheControl.includes('no-store') &&
                        networkResponse.headers.get('content-type')?.includes('image/')
                    ) {
                        await cache.put(req, networkResponse.clone());

                        // Periodically trim cache to keep it under entry limit
                        putCounter++;
                        if (putCounter % 50 === 0) {
                            trimCache(cache, MAX_TILE_ENTRIES);
                        }
                    }

                    return networkResponse;
                } catch {
                    // In offline mode with cache miss, return fallback 504
                    return new Response(null, {
                        status: 504,
                        statusText: 'Map Tile Unavailable Offline',
                    });
                }
            })
        );
    }
});
