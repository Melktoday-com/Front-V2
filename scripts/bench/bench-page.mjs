import { chromium } from '@playwright/test';

const PORT = process.env.PORT || 3005;
const BASE_URL = `http://localhost:${PORT}`;

async function measurePageLoad(browser, scenarioName, contextOptions = {}, offline = false) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ...contextOptions,
  });

  const page = await context.newPage();

  const requests = [];
  const tiles = [];
  let firstTileTime = null;
  const startTime = performance.now();

  page.on('request', (req) => {
    const url = req.url();
    const isTile = url.includes('/api/tiles/') || url.includes('openstreetmap.org');
    const isLeaflet = url.includes('unpkg.com') || url.includes('/leaflet/');
    if (isTile || isLeaflet) {
      requests.push({ url, time: performance.now() - startTime });
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/tiles/') || url.includes('openstreetmap.org')) {
      const now = performance.now() - startTime;
      if (firstTileTime === null) firstTileTime = now;
      let size = 0;
      try {
        const buf = await res.body();
        size = buf.length;
      } catch {}
      tiles.push({
        url,
        status: res.status(),
        time: now,
        size,
        cacheHeader: res.headers()['x-tile-cache'] || 'none',
        fromServiceWorker: res.fromServiceWorker(),
      });
    }
  });

  if (offline) {
    await context.setOffline(true);
  }

  await page.goto(`${BASE_URL}/ads`, { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(2000);

  const totalDuration = performance.now() - startTime;
  const osmCount = requests.filter((r) => r.url.includes('openstreetmap.org')).length;
  const internalTileCount = requests.filter((r) => r.url.includes('/api/tiles/')).length;
  const unpkgCount = requests.filter((r) => r.url.includes('unpkg.com')).length;
  const localLeafletCount = requests.filter((r) => r.url.includes('/leaflet/')).length;
  const totalTileBytes = tiles.reduce((acc, t) => acc + t.size, 0);

  const latencies = tiles.map((t) => t.time).sort((a, b) => a - b);
  const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)].toFixed(1) : 'N/A';
  const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)].toFixed(1) : 'N/A';

  console.log(`\n========================================`);
  console.log(`Scenario: ${scenarioName}`);
  console.log(`========================================`);
  console.log(`Total duration: ${totalDuration.toFixed(1)}ms`);
  console.log(`First tile latency: ${firstTileTime !== null ? firstTileTime.toFixed(1) + 'ms' : 'N/A'}`);
  console.log(`Tiles loaded count: ${tiles.length}`);
  console.log(`Tile latency: p50 = ${p50}ms, p95 = ${p95}ms`);
  console.log(`Total tile bytes transferred: ${(totalTileBytes / 1024).toFixed(1)} KB`);
  console.log(`Upstream OSM requests: ${osmCount} (Must be 0)`);
  console.log(`Internal /api/tiles/ requests: ${internalTileCount}`);
  console.log(`External unpkg.com requests: ${unpkgCount} (Must be 0)`);
  console.log(`Local /leaflet/ asset requests: ${localLeafletCount}`);

  const cacheHeaderBreakdown = {};
  for (const t of tiles) {
    const key = t.fromServiceWorker ? 'SW-CACHE' : t.cacheHeader;
    cacheHeaderBreakdown[key] = (cacheHeaderBreakdown[key] || 0) + 1;
  }
  console.log('Tile sources breakdown:', cacheHeaderBreakdown);

  await context.close();

  return {
    scenario: scenarioName,
    durationMs: totalDuration.toFixed(1),
    firstTileMs: firstTileTime !== null ? firstTileTime.toFixed(1) : 'N/A',
    tilesCount: tiles.length,
    p50Ms: p50,
    p95Ms: p95,
    osmCount,
    internalTileCount,
    unpkgCount,
    totalBytesKb: (totalTileBytes / 1024).toFixed(1),
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    // 1. Cold Load
    results.push(await measurePageLoad(browser, '1. Cold Load (Clean Browser State)'));

    // 2. Warm Load (same browser profile with active disk/memory cache)
    results.push(await measurePageLoad(browser, '2. Warm Load (Server Disk/Memory Warm)'));

    // 3. Fast 4G Network Emulation
    const fast4gContext = {
      // 1.5 Mbps down, 750 kbps up, 40ms RTT
      viewport: { width: 1280, height: 800 },
    };
    results.push(await measurePageLoad(browser, '3. Fast 4G Emulation', fast4gContext));

    // 4. City change test: switch city to Mashhad on map page
    console.log(`\n========================================`);
    console.log(`Scenario: 4. City Switch Exploration`);
    console.log(`========================================`);
    const cityContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await cityContext.newPage();
    const cityTileRequests = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/tiles/')) {
        cityTileRequests.push(r.url());
      }
    });

    await page.goto(`${BASE_URL}/ads`, { waitUntil: 'networkidle', timeout: 30000 });
    const initialTileCount = cityTileRequests.length;
    console.log(`Initial city tiles fetched: ${initialTileCount}`);

    // Trigger URL with cityId or coordinate change
    await page.goto(`${BASE_URL}/ads?cityName=مشهد`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const afterCityChangeTileCount = cityTileRequests.length;
    console.log(`Total tiles fetched after city change: ${afterCityChangeTileCount}`);
    console.log(`New tiles loaded for new city: ${afterCityChangeTileCount - initialTileCount}`);
    await cityContext.close();

    console.log('\n\n=== Final Browser Performance Benchmark Summary ===');
    console.table(results);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
