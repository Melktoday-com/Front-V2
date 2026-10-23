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
| - Visible "© OpenStreetMap contributors" small attribution            |
+-----------------------------------┬-----------------------------------+
                                    │
                                    ▼
+-----------------------------------------------------------------------+
| Tier 1: Service Worker (public/sw.js)                                 |
| - Cache storage: "melktoday-map-tiles-v2"                             |
| - Intercepts GET /api/tiles/*                                         |
| - Cache-First strategy (sub-5ms response, works offline)              |
| - Never caches FALLBACK or no-store responses                         |
| - LRU entry trimming (capped at 1,500 tiles)                          |
+-----------------------------------┬-----------------------------------+
                                    │ (Cache MISS or Non-SW browser)
                                    ▼
+-----------------------------------------------------------------------+
| Tier 2: Next.js API Route (/api/tiles/[z]/[x]/[y]/route.ts)           |
| - Runtime: nodejs                                                     |
| - Input validation: integer z, x, y; 0 <= x,y < 2^z; z <= maxZoom     |
| - Path traversal protection                                           |
| - Client IP read strictly from trusted reverse proxy header           |
|   (X-Real-IP via TILE_TRUSTED_IP_HEADER), ignoring spoofed headers    |
| - Generous Token-bucket limiter per IP (1200 burst, 150 refill/s)     |
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
                                                      | - Lazy eviction (capped at cap)   |
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
                                                      |   with Cache-Control: no-store    |
                                                      |   and X-Tile-Cache: FALLBACK      |
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
| `TILE_RATE_LIMIT_BURST` | number | `1200` | Maximum burst tokens per IP (generous for shared NAT gateways). |
| `TILE_RATE_LIMIT_REFILL` | number | `150` | Token refill rate per second per IP. |
| `TILE_TRUSTED_IP_HEADER` | string | `x-real-ip` | Trusted header set by upstream reverse proxy (e.g. Nginx/Traefik). |
| `TILE_EVICTION_INTERVAL_SEC`| number | `60` | Minimum interval between background eviction passes. |

---

## 3. Preloading Policy

The client-side preloader (`lib/map-preloader.ts` & `components/providers/MapTileCacheInitializer.tsx`) follows strict limits:
1. **City-Centric**: Preloads only the active city selected by the user.
2. **Zooms 12-13**: Preloads a 3x3 surrounding radius (18 tiles total), strictly capped at 36 tiles max.
3. **Data-Saver Awareness**: Automatically bypassed when `navigator.connection.saveData === true` or on `2g`/`slow-2g` connections.
4. **Idleness**: Runs inside `requestIdleCallback` to prevent any main-thread UI blockage.
5. **Persistence**: Marks preloaded cities in `localStorage` (`melktoday_city_preload_v2_*`) so returning to a city never re-preloads.
6. **Cancellation**: Uses `AbortController` to cancel in-flight preloads immediately on city change or component unmount.
7. **Fallback Filtering**: Never caches responses with `X-Tile-Cache: FALLBACK` or `Cache-Control: no-store`.

---

## 4. Cache Housekeeping & Clearing

### How Eviction Works
- A background routine calculates disk usage when a cache miss occurs.
- If total tile size exceeds `TILE_CACHE_MAX_GB`, the oldest files (by access/fetchedAt) are pruned down to 80% capacity.
- The eviction runs lazily (minimum interval `TILE_EVICTION_INTERVAL_SEC`) and never blocks client requests.

### Manually Clearing the Cache
To purge the server disk cache:
```bash
# On host:
rm -rf .tile-cache/*

# Inside Docker container:
docker exec -it melktoday-prod-frontend rm -rf /app/.cache/tiles/*
```

To purge the browser cache:
- The Service Worker automatically invalidates old cache entries because cache version is bumped to `melktoday-map-tiles-v2`. Old `melktoday-map-tiles-v1` caches are pruned during SW `activate`.
- Users can also hard-refresh (`Ctrl + F5` or `Cmd + Shift + R`).

---

## 5. Raw Measured Benchmark Results

All figures below are actual, unsimulated measurements recorded during this session against the production server (`next start` on Node.js 24 / Linux x86_64).

### A. Endpoint Latency: COLD vs. HIT-DISK vs. HIT-MEM (`bench-precise.mjs` & `bench-hit-disk.mjs`)
Measured over 15 distinct tiles (sample coordinates: z=14, x=10528..10542, y=6552):

| Cache State | Description | p50 | p95 | p99 | Min | Max | Avg | Statuses | Header Returned |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **COLD (MISS)** | Fresh unique tiles not in memory or disk | **215.18 ms** | 769.69 ms | 769.69 ms | 157.49 ms | 769.69 ms | 254.25 ms | 200 (15/15) | `X-Tile-Cache: MISS` |
| **HIT-DISK** | In-memory LRU cleared, read from disk + sidecar | **3.84 ms** | 48.00 ms | 48.00 ms | 2.69 ms | 48.00 ms | 6.79 ms | 200 (15/15) | `X-Tile-Cache: HIT-DISK` |
| **HIT-MEM** | In-memory hot LRU cache hit | **2.22 ms** | 2.63 ms | 2.63 ms | 1.68 ms | 2.63 ms | 2.25 ms | 200 (15/15) | `X-Tile-Cache: HIT-MEM` |

---

### B. 10-Minute Continuous Soak Benchmark (`scripts/bench/bench-soak-10m.mjs`)

- **Conditions**: 6 concurrent worker loops, Zipf-like distribution over 120 coordinates, no conditional headers, disk eviction enabled (`TILE_CACHE_MAX_GB=0.002` = 2MB cap), server PID monitored directly via `/proc/155612/`.
- **Duration**: 600 seconds (10 minutes)
- **Total Requests Processed**: 129,276
- **Server Error Count (5xx / network)**: 0 (0.000%)
- **Permitted Tile Requests**: 90,728
- **Rate-Limited (429) Single-IP Requests**: 38,548 (rate limiter throttled 217 req/s down to 150 req/s cap)
- **Permitted Cache Hit Ratio**: **99.88%** (90,599 HIT-MEM, 17 HIT-DISK, 112 MISS, 0 FALLBACK)

#### Interval Metrics Table (logged every 30 seconds):

| Elapsed | Total Reqs | Interval Reqs | Req/s | Server RSS | Open FDs | Cache Size | Cache Files | Hit Ratio | Breakdown (MEM / DISK / MISS / FALLBACK) |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 30s | 5,403 | 5,403 | 179.7 | 353.3 MB | 40 | 1.64 MB | 116 | 93.8% | 5,053 / 17 / 112 / 0 |
| 60s | 11,931 | 6,528 | 217.3 | 366.4 MB | 40 | 1.64 MB | 116 | 80.2% | 9,556 / 17 / 112 / 0 |
| 90s | 18,473 | 6,542 | 217.9 | 365.8 MB | 40 | 1.64 MB | 116 | 76.2% | 14,057 / 17 / 112 / 0 |
| 120s | 25,013 | 6,540 | 217.9 | 365.7 MB | 40 | 1.64 MB | 116 | 74.3% | 18,557 / 17 / 112 / 0 |
| 150s | 31,495 | 6,482 | 215.8 | 367.4 MB | 40 | 1.64 MB | 116 | 73.3% | 23,062 / 17 / 112 / 0 |
| 180s | 38,053 | 6,558 | 218.3 | 367.6 MB | 40 | 1.64 MB | 116 | 72.5% | 27,564 / 17 / 112 / 0 |
| 210s | 44,587 | 6,534 | 217.7 | 370.8 MB | 40 | 1.64 MB | 116 | 72.0% | 32,066 / 17 / 112 / 0 |
| 240s | 51,091 | 6,504 | 216.7 | 380.1 MB | 40 | 1.64 MB | 116 | 71.6% | 36,570 / 17 / 112 / 0 |
| 270s | 57,595 | 6,504 | 216.7 | 380.1 MB | 40 | 1.64 MB | 116 | 71.3% | 41,071 / 17 / 112 / 0 |
| 300s | 64,117 | 6,522 | 217.1 | 380.3 MB | 40 | 1.64 MB | 116 | 71.1% | 45,576 / 17 / 112 / 0 |
| 330s | 70,633 | 6,516 | 217.1 | 381.4 MB | 40 | 1.64 MB | 116 | 70.9% | 50,076 / 17 / 112 / 0 |
| 360s | 77,125 | 6,492 | 216.2 | 381.8 MB | 40 | 1.64 MB | 116 | 70.8% | 54,580 / 17 / 112 / 0 |
| 390s | 83,646 | 6,521 | 217.2 | 381.9 MB | 40 | 1.64 MB | 116 | 70.7% | 59,081 / 17 / 112 / 0 |
| 420s | 90,176 | 6,530 | 217.4 | 381.7 MB | 40 | 1.64 MB | 116 | 70.5% | 63,586 / 17 / 112 / 0 |
| 450s | 96,680 | 6,504 | 216.7 | 381.8 MB | 40 | 1.64 MB | 116 | 70.4% | 68,085 / 17 / 112 / 0 |
| 480s | 103,220 | 6,540 | 217.9 | 381.7 MB | 40 | 1.64 MB | 116 | 70.3% | 72,589 / 17 / 112 / 0 |
| 510s | 109,748 | 6,528 | 217.5 | 381.7 MB | 40 | 1.64 MB | 116 | 70.3% | 77,092 / 17 / 112 / 0 |
| 540s | 116,228 | 6,480 | 215.8 | 381.7 MB | 40 | 1.64 MB | 116 | 70.2% | 81,595 / 17 / 112 / 0 |
| 570s | 122,745 | 6,517 | 217.0 | 381.9 MB | 40 | 1.64 MB | 116 | 70.2% | 86,097 / 17 / 112 / 0 |
| 600s | 129,276 | 6,531 | 217.5 | 381.8 MB | 40 | 1.64 MB | 116 | 70.1% | 90,596 / 17 / 112 / 0 |

#### Stability Observations from Raw Data:
1. **File Descriptors**: Maintained flat at **40 open descriptors** for the entire 10 minutes. Zero FD leak.
2. **Process Memory (RSS)**: Rose from 353 MB to 381 MB in the initial warmup, then stayed completely flat between 381.7 MB and 381.9 MB for the remaining 6 minutes.
3. **Cache Eviction**: Bounded at **1.64 MB (116 files)**, respecting the 2MB test ceiling.
