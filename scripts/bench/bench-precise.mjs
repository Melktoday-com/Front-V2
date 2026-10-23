import fs from "fs/promises";
import path from "path";

const PORT = process.env.PORT || 3005;
const BASE_URL = `http://localhost:${PORT}`;

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  return {
    p50: Number(p50.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    p99: Number(p99.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    avg: Number(avg.toFixed(2)),
  };
}

async function main() {
  console.log(`Starting Precise Latency Measurement against ${BASE_URL}...`);

  // Use a set of tiles at zoom 14 around Tehran that have not been requested yet in this session
  // Center roughly at 35.6892, 51.3890 -> z=14 x=10528..10542, y=6552
  const testTiles = [];
  for (let i = 0; i < 15; i++) {
    testTiles.push({ z: 14, x: 10528 + i, y: 6552 });
  }

  // Ensure these tiles do not exist on disk before COLD test
  const cacheDir = process.env.TILE_CACHE_DIR || path.join(process.cwd(), ".tile-cache");
  for (const t of testTiles) {
    const tilePath = path.join(cacheDir, String(t.z), String(t.x), `${t.y}.png`);
    const metaPath = path.join(cacheDir, String(t.z), String(t.x), `${t.y}.json`);
    await fs.unlink(tilePath).catch(() => {});
    await fs.unlink(metaPath).catch(() => {});
  }

  // 1. COLD (MISS) - fetch unique uncached tiles
  console.log("\n--- Phase 1: Measuring COLD (Cache MISS from Upstream) ---");
  const coldLatencies = [];
  const coldStatuses = [];
  const coldCacheHeaders = [];

  for (const t of testTiles) {
    const url = `${BASE_URL}/api/tiles/${t.z}/${t.x}/${t.y}.png`;
    const t0 = performance.now();
    const res = await fetch(url, { headers: { "X-Real-IP": "10.0.0.1" } });
    const lat = performance.now() - t0;
    await res.arrayBuffer();
    coldLatencies.push(lat);
    coldStatuses.push(res.status);
    coldCacheHeaders.push(res.headers.get("x-tile-cache"));
  }

  const coldStats = calculatePercentiles(coldLatencies);
  console.log("COLD Results (15 unique tiles):", {
    ...coldStats,
    statuses: [...new Set(coldStatuses)],
    cacheHeaders: [...new Set(coldCacheHeaders)],
  });

  // 2. HIT-MEM - fetch the exact same tiles immediately from memory LRU
  console.log("\n--- Phase 2: Measuring HIT-MEM (In-Memory Hot LRU) ---");
  const hotLatencies = [];
  const hotStatuses = [];
  const hotCacheHeaders = [];

  for (const t of testTiles) {
    const url = `${BASE_URL}/api/tiles/${t.z}/${t.x}/${t.y}.png`;
    const t0 = performance.now();
    const res = await fetch(url, { headers: { "X-Real-IP": "10.0.0.1" } });
    const lat = performance.now() - t0;
    await res.arrayBuffer();
    hotLatencies.push(lat);
    hotStatuses.push(res.status);
    hotCacheHeaders.push(res.headers.get("x-tile-cache"));
  }

  const hotStats = calculatePercentiles(hotLatencies);
  console.log("HIT-MEM Results (15 tiles):", {
    ...hotStats,
    statuses: [...new Set(hotStatuses)],
    cacheHeaders: [...new Set(hotCacheHeaders)],
  });

  // 3. HIT-DISK - We need to clear memory LRU while keeping disk
  // We can flush memory LRU by flooding it with other tiles or we can test by clearing
  // memory cache via another run after server restart.
  console.log("\nMeasurements completed for COLD and HIT-MEM.");
  console.log(JSON.stringify({ coldStats, hotStats }, null, 2));
}

main().catch(console.error);
