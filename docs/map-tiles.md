# Map Tile Proxy & Tiered Caching System

This document provides architectural, operational, and benchmarking documentation for the self-hosted Map Tile Proxy and Tiered Caching system implemented in Melktoday V2.

---

## 1. Architecture Overview

To strictly comply with the [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) while ensuring sub-millisecond map loading speeds for users across Iran and worldwide, map tile delivery is organized in a multi-tier caching hierarchy:

```
+-----------------------------------------------------------------------+
| Browser Client (Persian RTL Real-Estate UI)                           |
| - TileLayer pointing to same-origin "/api/tiles/{z}/{x}/{y}.png"      |
| - Local Leaflet marker assets from "/leaflet/" (0 unpkg.com requests) |
| - DivIcon memoization & debounced viewport/bounds changes             |
+-----------------------------------┬-----------------------------------+
                                    │
                                    ▼
+-----------------------------------------------------------------------+
| Tier 1: Service Worker (public/sw.js)                                 |
| - Cache storage: "melktoday-map-tiles-v2"                             |
| - Intercepts GET /api/tiles/*                                         |
| - Cache-First strategy (sub-5ms response, works offline)              |
| - LRU entry trimming (capped at 1,500 tiles)                          |
+-----------------------------------┬-----------------------------------+
                                    │ (Cache MISS or Non-SW browser)
                                    ▼
+-----------------------------------------------------------------------+
| Tier 2: Next.js API Route (/api/tiles/[z]/[x]/[y]/route.ts)           |
| - Runtime: nodejs                                                     |
| - Input validation: integer z, x, y; 0 <= x,y < 2^z; z <= maxZoom     |
| - Path traversal protection                                           |
| - Token-bucket rate limiter per IP (prevents open proxy abuse)        |
+-----------------------------------┬-----------------------------------+
                                    │
         +--------------------------┴--------------------------+
         ▼                                                     ▼
+-----------------------------------+                 +-----------------------------------+
| Tier 3: In-Memory LRU Cache       |                 | Tier 4: Persistent Disk Cache     |
| - Bounded byte capacity (64MB)    |                 | - Layout: {z}/{x}/{y}.png         |
| - Doubly-linked LRU Map           |                 | - Sidecar metadata: {y}.json      |
| - Fast ETag & 304 response        |                 | - Atomic write (temp file rename) |
| - Negative 404 cache              |                 | - Stale-while-revalidate &        |
+-----------------------------------+                 |   Stale-if-error support          |
                                                      | - Lazy eviction (capped at 5GB)   |
                                                      +-----------------┬-----------------+
                                                                        │ (Cache MISS)
                                                                        ▼
                                                      +-----------------------------------+
                                                      | Tier 5: Upstream OSM Fetcher      |
                                                      | - Fixed upstream OSM tile host    |
                                                      | - Concurrency limited (max 6)     |
                                                      | - Single-flight coalescing        |
                                                      | - Exponential backoff on 429      |
                                                      | - Custom User-Agent with contact  |
                                                      | - 1x1 transparent fallback PNG    |
                                                      +-----------------------------------+
```

---

## 2. Environment Variables

Configure these settings in your `.env`, `.env.local`, or Docker environment:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `TILE_UPSTREAM_URL` | string | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Upstream tile URL template. |
| `TILE_USER_AGENT` | string | `MelktodayTileProxy/2.0 (+https://melktoday.com; contact@melktoday.com)` | User-Agent identifying Melktoday and contact info to OSM. |
| `TILE_CACHE_DIR` | string | `.tile-cache` | Absolute or relative filesystem path to persistent disk cache. |
| `TILE_TTL_DAYS` | number | `30` | Days a tile is considered fresh before background revalidation. |
| `TILE_CACHE_MAX_GB` | number | `5` | Maximum disk size in gigabytes before LRU eviction cleans oldest files. |
| `TILE_MAX_ZOOM` | number | `17` | Maximum zoom level permitted by the server (OSM policy constraint). |
| `TILE_UPSTREAM_CONCURRENCY` | number | `6` | Maximum simultaneous fetches to upstream OSM servers. |
| `TILE_MEM_CACHE_MAX_MB` | number | `64` | In-memory LRU cache capacity for hot tiles. |
| `TILE_RATE_LIMIT_BURST` | number | `150` | Maximum burst tokens per IP. |
| `TILE_RATE_LIMIT_REFILL` | number | `30` | Token refill rate per second per IP. |

---

## 3. Preloading Policy

The client-side preloader (`lib/map-preloader.ts` & `components/providers/MapTileCacheInitializer.tsx`) follows strict limits:
1. **City-Centric**: Preloads only the active city selected by the user.
2. **Zooms 12-13**: Preloads a 3x3 surrounding radius (18 tiles total), strictly capped at 36 tiles max.
3. **Data-Saver Awareness**: Automatically bypassed when `navigator.connection.saveData === true` or on `2g`/`slow-2g` connections.
4. **Idleness**: Runs inside `requestIdleCallback` to prevent any main-thread UI blockage.
5. **Persistence**: Marks preloaded cities in `localStorage` (`melktoday_city_preload_v2_*`) so returning to a city never re-preloads.
6. **Cancellation**: Uses `AbortController` to cancel in-flight preloads immediately on city change or component unmount.

---

## 4. Cache Housekeeping & Clearing

### How Eviction Works
- A background routine calculates disk usage when a cache miss occurs.
- If total tile size exceeds `TILE_CACHE_MAX_GB`, the oldest files (by access/fetchedAt) are pruned down to 80% capacity.
- The eviction runs lazily at most once every 10 minutes and never blocks client requests.

### Manually Clearing the Cache
To purge the server disk cache:
```bash
# On host:
rm -rf .tile-cache/*

# Inside Docker container:
docker exec -it melktoday-prod-frontend rm -rf /app/.cache/tiles/*
```

To purge the browser cache:
- The Service Worker will automatically invalidate old cache entries because cache version is bumped to `melktoday-map-tiles-v2`. Old `melktoday-map-tiles-v1` caches are pruned during SW `activate`.
- Users can also hard-refresh (`Ctrl + F5` or `Cmd + Shift + R`).

---

## 5. Benchmarking & Verification

Benchmark scripts are located in `scripts/bench/`:

### 1. Test Endpoint Throughput & Latency
Starts an autocannon load test measuring latency (p50, p95, p99) and req/sec under 10, 50, and 200 concurrency:
```bash
node scripts/bench/bench-endpoint.mjs
```

### 2. Full Browser Page Trace (Playwright)
Measures cold load, warm load, Fast 4G emulation, and city switching in headless Chromium:
```bash
node scripts/bench/bench-page.mjs
```

### 3. Soak Test
Runs sustained mixed traffic and monitors memory (RSS) and cache disk growth:
```bash
SOAK_DURATION_SEC=60 node scripts/bench/bench-soak.mjs
```

### 4. Automated Tests (Vitest)
Executes all 35 unit and integration tests (validation, LRU, rate limiting, disk caching, upstream mock):
```bash
npm run test
```
