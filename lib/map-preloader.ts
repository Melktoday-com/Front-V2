/**
/**
 * Map Tile Preloader & Background Caching Utility (Melktoday V2)
 * Strictly adheres to OSM usage policy and high-performance client practices:
 * - Preloads only the active city at zooms 12-13
 * - Concurrency capped at 4
 * - Hard cap on total preloaded tiles (max 36)
 * - Persists preloaded city status to prevent re-fetching
 * - Supports AbortSignal for immediate cancellation on city switch or component unmount
 * - Respects saveData and slow connections
 */

export const TILE_CACHE_NAME = "melktoday-map-tiles-v2";
const STORAGE_PREFIX = "melktoday_city_preload_v2_";
const MAX_PRELOAD_TILES = 36;
const PRELOAD_CONCURRENCY = 4;
const PRELOAD_CACHE_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let swRegistered = false;

/**
 * Converts geographic coordinates (lat, lng) and zoom level to tile coordinates (x, y)
 */
export function latLngToTile(
  lat: number,
  lng: number,
  zoom: number
): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/**
 * Computes a list of tile coordinates around a center point for given zoom levels
 */
export function computeSurroundingTiles(
  lat: number,
  lng: number,
  zooms: number[] = [12, 13],
  radius: number = 1
): Array<{ z: number; x: number; y: number }> {
  const tiles: Array<{ z: number; x: number; y: number }> = [];

  for (const z of zooms) {
    const center = latLngToTile(lat, lng, z);
    const maxCoord = Math.pow(2, z);

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const tx = center.x + dx;
        const ty = center.y + dy;
        if (tx >= 0 && tx < maxCoord && ty >= 0 && ty < maxCoord) {
          tiles.push({ z, x: tx, y: ty });
          if (tiles.length >= MAX_PRELOAD_TILES) {
            return tiles;
          }
        }
      }
    }
  }

  return tiles;
}

/**
 * Checks if the user is on a constrained network or has Data Saver enabled
 */
export function isNetworkConstrained(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as any).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  if (conn.effectiveType === "2g" || conn.effectiveType === "slow-2g") return true;
  return false;
}

/**
 * Checks whether a city has already been preloaded recently
 */
export function isCityAlreadyPreloaded(cityId: string | number): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const key = `${STORAGE_PREFIX}${cityId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < PRELOAD_CACHE_VALIDITY_MS) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Marks a city as preloaded in localStorage
 */
export function markCityAsPreloaded(cityId: string | number): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const key = `${STORAGE_PREFIX}${cityId}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        version: "v2",
      })
    );
  } catch {
    // Quota exceeded or private browsing; ignore silently
  }
}

/**
 * Registers the map tile caching service worker if supported
 */
export function initMapTileServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || swRegistered) {
    return;
  }

  swRegistered = true;

  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // Silently ignore registration failure in unsupported environments
      });
  };

  // Ensure registration never delays first paint
  if (document.readyState === "complete") {
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(register, { timeout: 4000 });
    } else {
      setTimeout(register, 1500);
    }
  } else {
    window.addEventListener("load", () => {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(register, { timeout: 4000 });
      } else {
        setTimeout(register, 1500);
      }
    });
  }
}

/**
 * Preloads surrounding map tiles for the selected city with concurrency 4 and AbortSignal
 */
export async function preloadCityMapTiles(
  cityId: string | number,
  lat: number,
  lng: number,
  zooms: number[] = [12, 13],
  signal?: AbortSignal
): Promise<void> {
  if (typeof window === "undefined") return;
  if (isNetworkConstrained()) return;
  if (isCityAlreadyPreloaded(cityId)) return;

  const tiles = computeSurroundingTiles(lat, lng, zooms, 1);
  if (tiles.length === 0) return;

  let cache: Cache | null = null;
  if ("caches" in window) {
    try {
      cache = await caches.open(TILE_CACHE_NAME);
    } catch {}
  }

  let index = 0;
  let activeWorkers = 0;
  let completed = 0;

  return new Promise<void>((resolve) => {
    const startNext = () => {
      if (signal?.aborted) {
        resolve();
        return;
      }

      if (index >= tiles.length && activeWorkers === 0) {
        markCityAsPreloaded(cityId);
        resolve();
        return;
      }

      while (activeWorkers < PRELOAD_CONCURRENCY && index < tiles.length) {
        if (signal?.aborted) {
          resolve();
          return;
        }

        const tile = tiles[index++];
        const url = `/api/tiles/${tile.z}/${tile.x}/${tile.y}.png`;
        activeWorkers++;

        const fetchOptions: RequestInit = {
          mode: "cors",
          signal,
          // Use priority low if supported by browser
          ...({ priority: "low" } as any),
        };

        const doFetch = async () => {
          try {
            if (cache) {
              const cached = await cache.match(url, { ignoreVary: true });
              if (cached) {
                return;
              }
            }

            const res = await fetch(url, fetchOptions);
            const isFallback = res.headers.get("x-tile-cache") === "FALLBACK";
            const cacheControl = res.headers.get("cache-control") || "";
            if (res.ok && !isFallback && !cacheControl.includes("no-store") && cache) {
              await cache.put(url, res.clone());
            }
          } catch {
            // Silently ignore individual tile preload failures
          } finally {
            activeWorkers--;
            completed++;
            startNext();
          }
        };

        doFetch();
      }
    };

    startNext();
  });
}
