import { getTileConfig, TileProxyConfig } from "./config";
import { validateTileParams } from "./validation";
import { getMemoryTileCache, MemoryTileCache } from "./memory-cache";
import { getTileRateLimiter, TileRateLimiter } from "./rate-limiter";
import {
  readDiskTile,
  writeDiskTile,
  touchDiskTileMetadata,
  maybeRunDiskEviction,
  computeBufferEtag,
} from "./disk-cache";
import {
  getUpstreamFetcher,
  UpstreamFetcher,
  TRANSPARENT_1X1_PNG,
} from "./upstream-fetcher";

const COMMON_CACHE_CONTROL = "public, max-age=2592000, stale-while-revalidate=86400, immutable";

function toUint8Array(buf: Buffer): BodyInit {
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) as unknown as BodyInit;
}

export interface TileServiceOptions {
  config?: TileProxyConfig;
  memoryCache?: MemoryTileCache;
  rateLimiter?: TileRateLimiter;
  upstreamFetcher?: UpstreamFetcher;
}

export async function processTileRequest(
  rawZ: string | undefined,
  rawX: string | undefined,
  rawY: string | undefined,
  headers: Headers,
  options: TileServiceOptions = {}
): Promise<Response> {
  const config = options.config || getTileConfig();
  const memoryCache = options.memoryCache || getMemoryTileCache(config.memCacheMaxMb);
  const rateLimiter =
    options.rateLimiter || getTileRateLimiter(config.rateLimitBurst, config.rateLimitRefill);
  const upstreamFetcher = options.upstreamFetcher || getUpstreamFetcher(config);

  // 1. IP Rate Limiting
  const clientIp =
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "127.0.0.1";

  const rateCheck = rateLimiter.consume(clientIp);
  if (!rateCheck.allowed) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "Content-Type": "text/plain",
        "Retry-After": String(rateCheck.retryAfter),
      },
    });
  }

  // 2. Parameter validation & path traversal protection
  const coords = validateTileParams(rawZ, rawX, rawY, config.maxZoom);
  if (!coords) {
    return new Response("Invalid tile coordinates", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const clientIfNoneMatch = headers.get("if-none-match") || undefined;

  // 3. Negative cache for recent 404s
  if (memoryCache.isNegativeCached(coords.key)) {
    return new Response(toUint8Array(TRANSPARENT_1X1_PNG), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
        "X-Tile-Cache": "MISS",
        "X-Tile-Fallback": "404-negative",
      },
    });
  }

  // 4. Cache Layer 1: In-Memory LRU
  const memHit = memoryCache.get(coords.key);
  if (memHit) {
    if (clientIfNoneMatch && clientIfNoneMatch === memHit.etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: memHit.etag,
          "Cache-Control": COMMON_CACHE_CONTROL,
          "X-Tile-Cache": "HIT-MEM",
        },
      });
    }

    return new Response(toUint8Array(memHit.buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": COMMON_CACHE_CONTROL,
        ETag: memHit.etag,
        "X-Tile-Cache": "HIT-MEM",
      },
    });
  }

  // 5. Cache Layer 2: Disk Cache
  const diskHit = await readDiskTile(config.cacheDir, coords.z, coords.x, coords.y);
  if (diskHit) {
    const ageMs = Date.now() - diskHit.fetchedAt;
    const ttlMs = config.ttlDays * 24 * 60 * 60 * 1000;
    const isFresh = ageMs < ttlMs;

    // Populate memory cache
    memoryCache.set(coords.key, {
      buffer: diskHit.buffer,
      etag: diskHit.etag,
      fetchedAt: diskHit.fetchedAt,
    });

    if (isFresh) {
      if (clientIfNoneMatch && clientIfNoneMatch === diskHit.etag) {
        return new Response(null, {
          status: 304,
          headers: {
            ETag: diskHit.etag,
            "Cache-Control": COMMON_CACHE_CONTROL,
            "X-Tile-Cache": "HIT-DISK",
          },
        });
      }

      return new Response(toUint8Array(diskHit.buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": COMMON_CACHE_CONTROL,
          ETag: diskHit.etag,
          "X-Tile-Cache": "HIT-DISK",
        },
      });
    }

    // Stale: serve stale immediately and revalidate in background (stale-while-revalidate)
    const staleResponse = () => {
      if (clientIfNoneMatch && clientIfNoneMatch === diskHit.etag) {
        return new Response(null, {
          status: 304,
          headers: {
            ETag: diskHit.etag,
            "Cache-Control": COMMON_CACHE_CONTROL,
            "X-Tile-Cache": "STALE",
          },
        });
      }
      return new Response(toUint8Array(diskHit.buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": COMMON_CACHE_CONTROL,
          ETag: diskHit.etag,
          "X-Tile-Cache": "STALE",
        },
      });
    };

    // Trigger background revalidation (swallow any errors)
    upstreamFetcher
      .fetchTile(coords.z, coords.x, coords.y, diskHit.etag)
      .then(async (revalResult) => {
        if (revalResult.is304) {
          // Upstream confirmed tile is unchanged: refresh timestamp
          await touchDiskTileMetadata(config.cacheDir, coords.z, coords.x, coords.y);
          memoryCache.set(coords.key, {
            buffer: diskHit.buffer,
            etag: diskHit.etag,
            fetchedAt: Date.now(),
          });
        } else if (revalResult.status === 200 && revalResult.buffer) {
          // Fresh tile received: update disk and memory
          const etag = revalResult.etag || computeBufferEtag(revalResult.buffer);
          await writeDiskTile(
            config.cacheDir,
            coords.z,
            coords.x,
            coords.y,
            revalResult.buffer,
            etag
          );
          memoryCache.set(coords.key, {
            buffer: revalResult.buffer,
            etag,
            fetchedAt: Date.now(),
          });
        }
      })
      .catch(() => {
        // Silently tolerate background revalidation failure (stale-if-error)
      });

    return staleResponse();
  }

  // 6. Cache Layer 3: Upstream Fetch (Cache MISS)
  const upstream = await upstreamFetcher.fetchTile(coords.z, coords.x, coords.y);

  if (upstream.status === 200 && upstream.buffer) {
    const etag = upstream.etag || computeBufferEtag(upstream.buffer);

    // Save to disk cache atomically
    await writeDiskTile(
      config.cacheDir,
      coords.z,
      coords.x,
      coords.y,
      upstream.buffer,
      etag
    ).catch((err) => {
      console.error("[TileProxy] Disk write error:", err);
    });

    // Save to memory cache
    memoryCache.set(coords.key, {
      buffer: upstream.buffer,
      etag,
      fetchedAt: Date.now(),
    });

    // Schedule lazy background eviction check
    maybeRunDiskEviction(config.cacheDir, config.cacheMaxGb);

    if (clientIfNoneMatch && clientIfNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": COMMON_CACHE_CONTROL,
          "X-Tile-Cache": "MISS",
        },
      });
    }

    return new Response(toUint8Array(upstream.buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": COMMON_CACHE_CONTROL,
        ETag: etag,
        "X-Tile-Cache": "MISS",
      },
    });
  }

  if (upstream.is404) {
    memoryCache.setNegativeCache(coords.key);
    return new Response(toUint8Array(TRANSPARENT_1X1_PNG), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
        "X-Tile-Cache": "MISS",
        "X-Tile-Fallback": "404",
      },
    });
  }

  // If upstream failed and returned non-200, provide transparent fallback so map does not show broken tiles
  return new Response(toUint8Array(TRANSPARENT_1X1_PNG), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Tile-Cache": "MISS",
      "X-Tile-Fallback": `upstream-${upstream.status}`,
    },
  });
}
