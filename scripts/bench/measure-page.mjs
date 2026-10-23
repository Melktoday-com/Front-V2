import { chromium } from '@playwright/test';

async function runMeasurement() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const requests = [];
  const tiles = [];
  let firstTileTime = null;
  const startTime = Date.now();

  page.on('request', (req) => {
    const url = req.url();
    const isTile = url.includes('tile.openstreetmap.org') || url.includes('/api/tiles/');
    const isLeafletAsset = url.includes('unpkg.com');
    if (isTile || isLeafletAsset) {
      requests.push({ url, time: Date.now() - startTime });
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    const isTile = url.includes('tile.openstreetmap.org') || url.includes('/api/tiles/');
    if (isTile) {
      const now = Date.now() - startTime;
      if (firstTileTime === null) firstTileTime = now;
      let bodySize = 0;
      try {
        const buf = await res.body();
        bodySize = buf.length;
      } catch {}
      tiles.push({
        url,
        status: res.status(),
        time: now,
        size: bodySize,
        cacheHeader: res.headers()['x-tile-cache'] || 'none',
        fromServiceWorker: res.fromServiceWorker(),
      });
    }
  });

  console.log('Navigating to http://localhost:3005/ads ...');
  await page.goto('http://localhost:3005/ads', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait extra 3 seconds for idle preloader
  await page.waitForTimeout(3000);

  const totalTime = Date.now() - startTime;
  const osmCount = requests.filter((r) => r.url.includes('tile.openstreetmap.org')).length;
  const localTileCount = requests.filter((r) => r.url.includes('/api/tiles/')).length;
  const unpkgCount = requests.filter((r) => r.url.includes('unpkg.com')).length;
  const totalTileBytes = tiles.reduce((acc, t) => acc + t.size, 0);

  console.log('\n=== Map Page Performance Measurement ===');
  console.log(`Total duration: ${totalTime}ms`);
  console.log(`First tile response: ${firstTileTime}ms`);
  console.log(`Total tile responses: ${tiles.length}`);
  console.log(`Total tile bytes transferred: ${(totalTileBytes / 1024).toFixed(1)} KB`);
  console.log(`Requests to tile.openstreetmap.org: ${osmCount}`);
  console.log(`Requests to /api/tiles/: ${localTileCount}`);
  console.log(`Requests to unpkg.com: ${unpkgCount}`);
  if (tiles.length > 0) {
    const latencies = tiles.map((t) => t.time).sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    console.log(`Tile latency p50: ${p50}ms, p95: ${p95}ms`);
  }

  await browser.close();
}

runMeasurement().catch((err) => {
  console.error('Measurement error:', err);
  process.exit(1);
});
