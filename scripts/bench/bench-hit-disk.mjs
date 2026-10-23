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
  console.log(`Measuring HIT-DISK against ${BASE_URL}...`);

  const testTiles = [];
  for (let i = 0; i < 15; i++) {
    testTiles.push({ z: 14, x: 10528 + i, y: 6552 });
  }

  const diskLatencies = [];
  const diskStatuses = [];
  const diskCacheHeaders = [];

  for (const t of testTiles) {
    const url = `${BASE_URL}/api/tiles/${t.z}/${t.x}/${t.y}.png`;
    const t0 = performance.now();
    const res = await fetch(url, { headers: { "X-Real-IP": "10.0.0.1" } });
    const lat = performance.now() - t0;
    await res.arrayBuffer();
    diskLatencies.push(lat);
    diskStatuses.push(res.status);
    diskCacheHeaders.push(res.headers.get("x-tile-cache"));
  }

  const diskStats = calculatePercentiles(diskLatencies);
  console.log("HIT-DISK Results (15 tiles):", {
    ...diskStats,
    statuses: [...new Set(diskStatuses)],
    cacheHeaders: [...new Set(diskCacheHeaders)],
  });

  console.log(JSON.stringify({ diskStats }, null, 2));
}

main().catch(console.error);
