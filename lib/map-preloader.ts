/**
 * Map Tile Preloader & Background Caching Utility
 * Preloads surrounding map tiles into Cache Storage during browser idle time
 */

const TILE_CACHE_NAME = 'melktoday-map-tiles-v1';
const PRELOADED_URLS = new Set<string>();

/**
 * Converts geographic coordinates (lat, lng) and zoom level to OSM tile (x, y) coordinates
 */
export function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
    return { x, y };
}

/**
 * Registers the map tile caching service worker if supported
 */
export function initMapTileServiceWorker(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .catch(() => {
                // Silently ignore registration failure in unsupported environments
            });
    });
}

/**
 * Preload surrounding tiles for a given coordinate & zoom level in the background
 * Only runs when the browser is idle to never impact UI responsiveness
 */
export function preloadCityMapTiles(
    lat: number,
    lng: number,
    zoomLevels: number[] = [12, 13]
): void {
    if (typeof window === 'undefined' || !('caches' in window)) {
        return;
    }

    const runPreload = () => {
        caches.open(TILE_CACHE_NAME).then((cache) => {
            const urlsToFetch: string[] = [];
            const subdomains = ['a', 'b', 'c'];

            for (const z of zoomLevels) {
                const centerTile = latLngToTile(lat, lng, z);
                // Preload a 3x3 tile grid surrounding center (radius 1 = 9 tiles)
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const tileX = centerTile.x + dx;
                        const tileY = centerTile.y + dy;
                        const sub = subdomains[Math.abs(tileX + tileY) % subdomains.length];
                        const url = `https://${sub}.tile.openstreetmap.org/${z}/${tileX}/${tileY}.png`;

                        if (!PRELOADED_URLS.has(url)) {
                            PRELOADED_URLS.add(url);
                            urlsToFetch.push(url);
                        }
                    }
                }
            }

            // Fetch in background batches without blocking main thread
            urlsToFetch.forEach((url) => {
                cache.match(url).then((existing) => {
                    if (!existing) {
                        fetch(url, { mode: 'cors' })
                            .then((res) => {
                                if (res.ok) {
                                    cache.put(url, res);
                                }
                            })
                            .catch(() => {
                                // Ignore network errors during idle prefetch
                            });
                    }
                });
            });
        });
    };

    if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(runPreload, { timeout: 3000 });
    } else {
        setTimeout(runPreload, 1500);
    }
}
