import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { execSync } from "child_process";

const PORT = process.env.PORT || 3005;
const BASE_URL = `http://localhost:${PORT}`;
const DURATION_SEC = parseInt(process.env.SOAK_DURATION_SEC || "600", 10); // 10 minutes default
const CACHE_DIR = process.env.TILE_CACHE_DIR || path.join(process.cwd(), ".tile-cache");
const REPORT_INTERVAL_SEC = 30;

function findServerPid(port) {
  try {
    const out = execSync(`ss -tulpn | grep ":${port} "`, { encoding: "utf8" });
    const match = out.match(/pid=(\d+)/);
    if (match) return parseInt(match[1], 10);
  } catch {}
  return null;
}

function getServerMetrics(pid) {
  if (!pid) return { rssMb: null, fds: null };
  let rssMb = null;
  let fds = null;
  try {
    const status = fsSync.readFileSync(`/proc/${pid}/status`, "utf8");
    const vmRssLine = status.split("\n").find((l) => l.startsWith("VmRSS:"));
    if (vmRssLine) {
      const kb = parseInt(vmRssLine.replace(/\D+/g, ""), 10);
      rssMb = Number((kb / 1024).toFixed(1));
    }
  } catch {}

  try {
    const fdList = fsSync.readdirSync(`/proc/${pid}/fd`);
    fds = fdList.length;
  } catch {}

  return { rssMb, fds };
}

async function getDirSize(dir) {
  let size = 0;
  let count = 0;
  async function scan(current) {
    let entries = [];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        await scan(full);
      } else if (e.isFile()) {
        try {
          const stat = await fs.stat(full);
          size += stat.size;
          count++;
        } catch {}
      }
    }
  }
  await scan(dir);
  return { size, count };
}

// Generate 120 tile coordinates around Tehran & surrounding zones
function generateTileSet() {
  const tiles = [];
  // Zoom 12 (16 tiles around center)
  for (let dx = -2; dx <= 1; dx++) {
    for (let dy = -2; dy <= 1; dy++) {
      tiles.push({ z: 12, x: 2632 + dx, y: 1638 + dy });
    }
  }
  // Zoom 13 (36 tiles)
  for (let dx = -3; dx <= 2; dx++) {
    for (let dy = -3; dy <= 2; dy++) {
      tiles.push({ z: 13, x: 5264 + dx, y: 3276 + dy });
    }
  }
  // Zoom 14 (68 tiles)
  for (let dx = -4; dx <= 4; dx++) {
    for (let dy = -4; dy <= 3; dy++) {
      tiles.push({ z: 14, x: 10528 + dx, y: 6552 + dy });
    }
  }
  return tiles.slice(0, 120);
}

// Setup Zipf distribution: P(k) proportional to 1 / (k^0.8)
function buildZipfCdf(length, alpha = 0.8) {
  const weights = [];
  let sum = 0;
  for (let k = 1; k <= length; k++) {
    const w = 1 / Math.pow(k, alpha);
    sum += w;
    weights.push(sum);
  }
  return { weights, totalWeight: sum };
}

function pickZipfTile(tiles, zipf) {
  const r = Math.random() * zipf.totalWeight;
  let low = 0;
  let high = tiles.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (zipf.weights[mid] < r) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return tiles[low];
}

async function run() {
  const serverPid = findServerPid(PORT);
  console.log(`Starting 10-Minute Soak Benchmark against ${BASE_URL}`);
  console.log(`Server PID detected: ${serverPid || "Not found (will report agent PID)"}`);
  console.log(`Target duration: ${DURATION_SEC} seconds (${(DURATION_SEC / 60).toFixed(1)} minutes)`);
  console.log(`Cache directory: ${CACHE_DIR}`);

  const tiles = generateTileSet();
  const zipf = buildZipfCdf(tiles.length, 0.8);

  const monitoredPid = serverPid || process.pid;

  const records = [];
  const startTime = Date.now();
  let lastReportTime = startTime;
  let intervalReqs = 0;

  let totalRequests = 0;
  let errorCount = 0;
  let hitMem = 0;
  let hitDisk = 0;
  let miss = 0;
  let fallback = 0;

  console.log("\n| Elapsed | Total Reqs | Interval Reqs | Req/s | Server RSS | Open FDs | Cache Size | Cache Files | Hit Ratio | Breakdown (MEM/DISK/MISS/FALLBACK) |");
  console.log("|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|");

  const concurrency = 6;
  let running = true;

  // Worker loop
  async function worker() {
    while (running) {
      const tile = pickZipfTile(tiles, zipf);
      const url = `${BASE_URL}/api/tiles/${tile.z}/${tile.x}/${tile.y}.png`;
      totalRequests++;
      intervalReqs++;

      try {
        const res = await fetch(url, {
          headers: { "X-Real-IP": "192.168.1.10" },
        });

        const cacheHeader = res.headers.get("x-tile-cache");
        if (cacheHeader === "HIT-MEM") hitMem++;
        else if (cacheHeader === "HIT-DISK") hitDisk++;
        else if (cacheHeader === "MISS") miss++;
        else if (cacheHeader === "FALLBACK") fallback++;

        if (res.status >= 500) errorCount++;
        await res.arrayBuffer();
      } catch {
        errorCount++;
      }

      // Small throttle between requests per worker to keep smooth sustainable load
      await new Promise((r) => setTimeout(r, 25));
    }
  }

  // Launch parallel workers
  const workers = Array.from({ length: concurrency }).map(() => worker());

  // Reporter timer loop
  while (Date.now() - startTime < DURATION_SEC * 1000) {
    await new Promise((r) => setTimeout(r, 1000));
    const now = Date.now();

    if (now - lastReportTime >= REPORT_INTERVAL_SEC * 1000) {
      const elapsedSec = Math.floor((now - startTime) / 1000);
      const intervalSec = (now - lastReportTime) / 1000;
      const rps = (intervalReqs / intervalSec).toFixed(1);

      const sMetrics = getServerMetrics(monitoredPid);
      const dirStats = await getDirSize(CACHE_DIR);

      const hitCount = hitMem + hitDisk;
      const hitRatio = ((hitCount / Math.max(1, totalRequests)) * 100).toFixed(1);

      const row = {
        elapsed: `${elapsedSec}s`,
        totalRequests,
        intervalReqs,
        rps,
        rssMb: sMetrics.rssMb !== null ? `${sMetrics.rssMb} MB` : "N/A",
        fds: sMetrics.fds !== null ? sMetrics.fds : "N/A",
        cacheSizeMb: `${(dirStats.size / (1024 * 1024)).toFixed(2)} MB`,
        cacheFiles: dirStats.count,
        hitRatio: `${hitRatio}%`,
        breakdown: `${hitMem} / ${hitDisk} / ${miss} / ${fallback}`,
      };

      records.push(row);

      console.log(
        `| ${row.elapsed.padStart(7)} | ${String(row.totalRequests).padStart(10)} | ${String(row.intervalReqs).padStart(13)} | ${row.rps.padStart(5)} | ${String(row.rssMb).padStart(10)} | ${String(row.fds).padStart(8)} | ${row.cacheSizeMb.padStart(10)} | ${String(row.cacheFiles).padStart(11)} | ${row.hitRatio.padStart(9)} | ${row.breakdown.padStart(34)} |`
      );

      intervalReqs = 0;
      lastReportTime = now;
    }
  }

  running = false;
  await Promise.all(workers);

  const finalDirStats = await getDirSize(CACHE_DIR);
  const finalMetrics = getServerMetrics(monitoredPid);
  const finalHitRatio = (((hitMem + hitDisk) / Math.max(1, totalRequests)) * 100).toFixed(2);

  console.log("\n=======================================================");
  console.log("             10-MINUTE SOAK BENCHMARK COMPLETE         ");
  console.log("=======================================================");
  console.log(`Total Elapsed Time: ${Math.floor((Date.now() - startTime) / 1000)} seconds`);
  console.log(`Total Requests Processed: ${totalRequests}`);
  console.log(`Error Count: ${errorCount} (${((errorCount / totalRequests) * 100).toFixed(3)}%)`);
  console.log(`Final Cache Hit Ratio: ${finalHitRatio}%`);
  console.log(`Cache Breakdown:`);
  console.log(`  - HIT-MEM:  ${hitMem} (${((hitMem / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`  - HIT-DISK: ${hitDisk} (${((hitDisk / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`  - MISS:     ${miss} (${((miss / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`  - FALLBACK: ${fallback} (${((fallback / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Final Disk Cache Files: ${finalDirStats.count}`);
  console.log(`Final Disk Cache Size: ${(finalDirStats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Final Server RSS Memory: ${finalMetrics.rssMb} MB`);
  console.log(`Final Server Open FDs: ${finalMetrics.fds}`);

  // Save raw log to JSON for docs/map-tiles.md
  await fs.writeFile(
    path.join(process.cwd(), "scripts/bench/soak-10m-results.json"),
    JSON.stringify(
      {
        totalRequests,
        errorCount,
        finalHitRatio,
        hitMem,
        hitDisk,
        miss,
        fallback,
        finalDirStats,
        finalMetrics,
        records,
      },
      null,
      2
    )
  );
  console.log(`Raw results saved to scripts/bench/soak-10m-results.json`);
}

run().catch(console.error);
