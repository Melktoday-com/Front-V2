import fs from "fs/promises";
import path from "path";

const PORT = process.env.PORT || 3005;
const BASE_URL = `http://localhost:${PORT}`;
const DURATION_SEC = parseInt(process.env.SOAK_DURATION_SEC || "60", 10);
const CACHE_DIR = process.env.TILE_CACHE_DIR || path.join(process.cwd(), ".tile-cache");

async function getDirSize(dir) {
  let size = 0;
  let count = 0;
  async function scan(current) {
    try {
      const entries = await fs.readdir(current, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(current, e.name);
        if (e.isDirectory()) {
          await scan(full);
        } else if (e.isFile()) {
          const stat = await fs.stat(full);
          size += stat.size;
          count++;
        }
      }
    } catch {}
  }
  await scan(dir);
  return { size, count };
}

async function runSoak() {
  console.log(`Starting Soak Test against ${BASE_URL} for ${DURATION_SEC} seconds...`);
  console.log(`Monitoring Cache Dir: ${CACHE_DIR}`);

  const startMemory = process.memoryUsage();
  console.log(`Initial Agent Process RSS: ${(startMemory.rss / (1024 * 1024)).toFixed(1)} MB`);

  const startTime = Date.now();
  let totalRequests = 0;
  let errorCount = 0;
  let hitMem = 0;
  let hitDisk = 0;
  let miss = 0;

  // Set of sample tiles around Tehran and Mashhad
  const sampleTiles = [
    { z: 12, x: 2632, y: 1638 },
    { z: 12, x: 2633, y: 1638 },
    { z: 12, x: 2632, y: 1639 },
    { z: 12, x: 2633, y: 1639 },
    { z: 13, x: 5264, y: 3276 },
    { z: 13, x: 5265, y: 3276 },
    { z: 13, x: 5264, y: 3277 },
    { z: 13, x: 5265, y: 3277 },
    { z: 12, x: 2726, y: 1622 }, // Mashhad
    { z: 12, x: 2727, y: 1622 },
  ];

  let lastReport = Date.now();

  while (Date.now() - startTime < DURATION_SEC * 1000) {
    // Pick 5 random tile requests concurrently
    const batch = Array.from({ length: 5 }).map(async () => {
      const tile = sampleTiles[Math.floor(Math.random() * sampleTiles.length)];
      // Occasionally simulate 304 with If-None-Match or a stale tile
      const headers = {};
      if (Math.random() > 0.6) {
        headers["If-None-Match"] = '"mock-etag"';
      }

      totalRequests++;
      try {
        const res = await fetch(`${BASE_URL}/api/tiles/${tile.z}/${tile.x}/${tile.y}.png`, { headers });
        const cacheHeader = res.headers.get("x-tile-cache");
        if (cacheHeader === "HIT-MEM") hitMem++;
        else if (cacheHeader === "HIT-DISK") hitDisk++;
        else if (cacheHeader === "MISS") miss++;

        if (res.status >= 500) errorCount++;
      } catch {
        errorCount++;
      }
    });

    await Promise.all(batch);
    await new Promise((r) => setTimeout(r, 20)); // slight throttle

    const now = Date.now();
    if (now - lastReport >= 10000) {
      lastReport = now;
      const mem = process.memoryUsage();
      const dirStat = await getDirSize(CACHE_DIR);
      console.log(
        `[${((now - startTime) / 1000).toFixed(0)}s] Reqs: ${totalRequests} | Hits: mem=${hitMem}, disk=${hitDisk}, miss=${miss} | Disk: ${(dirStat.size / 1024).toFixed(1)} KB (${dirStat.count} files) | RSS: ${(mem.rss / (1024 * 1024)).toFixed(1)} MB`
      );
    }
  }

  const finalDirStat = await getDirSize(CACHE_DIR);
  const finalMemory = process.memoryUsage();

  console.log("\n=== Soak Test Summary ===");
  console.log(`Duration: ${DURATION_SEC} seconds`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Error Count: ${errorCount} (${((errorCount / totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Cache Hits: MEM=${hitMem}, DISK=${hitDisk}, MISS=${miss}`);
  console.log(`Cache Hit Ratio: ${(((hitMem + hitDisk) / Math.max(1, totalRequests)) * 100).toFixed(1)}%`);
  console.log(`Final Cache Files: ${finalDirStat.count}`);
  console.log(`Final Cache Size: ${(finalDirStat.size / 1024).toFixed(1)} KB`);
  console.log(`Agent Memory Delta (RSS): ${((finalMemory.rss - startMemory.rss) / (1024 * 1024)).toFixed(1)} MB`);
}

runSoak().catch(console.error);
