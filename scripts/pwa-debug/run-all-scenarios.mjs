import { chromium, devices } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3008";
const OUTPUT_DIR = path.resolve("scripts/pwa-debug/output");

await fs.mkdir(OUTPUT_DIR, { recursive: true });

async function runScenario(scenarioId, name, setupFn) {
  console.log(`\n======================================================`);
  console.log(`[SCENARIO ${scenarioId}] ${name}`);
  console.log(`======================================================`);

  const results = {
    scenarioId,
    name,
    timestamp: new Date().toISOString(),
    tileRequests: [],
    failedRequests: [],
    consoleErrors: [],
    tilesLoadedCount: 0,
    swController: null,
    containerSize: null,
    leafletSize: null,
    screenshot: null,
    status: "UNKNOWN",
  };

  const { browser, context, page, skipNavigation } = await setupFn();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      results.consoleErrors.push(msg.text());
    }
  });

  page.on("requestfailed", (req) => {
    results.failedRequests.push({
      url: req.url(),
      failure: req.failure()?.errorText,
    });
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/api/tiles/")) {
      results.tileRequests.push({
        url,
        status: res.status(),
        fromSW: res.fromServiceWorker(),
        xTileCache: res.headers()["x-tile-cache"] || null,
        cacheControl: res.headers()["cache-control"] || null,
        vary: res.headers()["vary"] || null,
      });
    }
  });

  try {
    if (!skipNavigation) {
      await page.goto(`${BASE_URL}/ads?mapdebug=1`, { waitUntil: "networkidle", timeout: 25000 });
    }

    // Wait a brief moment for Leaflet initialization & animations
    await page.waitForTimeout(2000);

    // If on mobile viewport and map toggle button exists, click it to show map
    const toggleBtn = page.locator('button:has-text("مشاهده روی نقشه"), button[title="نمایش تمام‌صفحه نقشه"]');
    if ((await toggleBtn.count()) > 0 && (await toggleBtn.first().isVisible())) {
      console.log(`[SCENARIO ${scenarioId}] Clicking mobile map toggle button...`);
      await toggleBtn.first().click({ force: true });
      await page.waitForTimeout(2000);
    }

    // Inspect SW controller
    results.swController = await page.evaluate(() => {
      const c = navigator.serviceWorker?.controller;
      return c ? { scriptURL: c.scriptURL, state: c.state } : null;
    });

    // Inspect Leaflet container & size
    const containerStats = await page.evaluate(() => {
      const el = document.querySelector(".leaflet-container");
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
        computed: { width: style.width, height: style.height, display: style.display },
      };
    });
    results.containerSize = containerStats;

    // Check count of loaded tile img elements
    results.tilesLoadedCount = await page.locator("img.leaflet-tile-loaded").count();

    // Check Leaflet internal map.getSize() via debug logs or evaluate
    results.leafletSize = await page.evaluate(() => {
      const logs = window.__mapDebugLogs || [];
      const snapshot = logs.find((l) => l.message === "System and Map Container Snapshot");
      return snapshot?.data?.leafletSize || null;
    });

    // Take screenshot
    const screenshotPath = path.join(OUTPUT_DIR, `scenario-${scenarioId}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    results.screenshot = screenshotPath;

    // Evaluate success criteria:
    // Container has >0 height, at least 6 tiles loaded
    if (results.containerSize?.rect?.height > 50 && results.tilesLoadedCount >= 6) {
      results.status = "SUCCESS";
    } else {
      results.status = "FAILURE";
    }
  } catch (err) {
    results.status = "ERROR";
    results.error = err.message;
  } finally {
    await browser.close();
  }

  console.log(`Status: ${results.status}`);
  console.log(`Tiles loaded: ${results.tilesLoadedCount}`);
  console.log(`Tile requests captured: ${results.tileRequests.length}`);
  console.log(`SW Controller:`, results.swController);
  console.log(`Container size:`, results.containerSize?.rect);
  console.log(`Leaflet size:`, results.leafletSize);
  console.log(`Console errors:`, results.consoleErrors.length);
  console.log(`Failed requests:`, results.failedRequests.length);

  return results;
}

const scenarioReports = [];

// SCENARIO 1: Normal tab, FIRST visit (SW not yet controlling)
scenarioReports.push(
  await runScenario("1", "Normal tab, FIRST visit (SW not yet controlling)", async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    return { browser, context, page };
  })
);

// SCENARIO 2: Normal tab, second visit after reload (SW controlling)
scenarioReports.push(
  await runScenario("2", "Normal tab, second visit after reload (SW controlling)", async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    return { browser, context, page };
  })
);

// SCENARIO 3A: Standalone desktop display-mode emulation
scenarioReports.push(
  await runScenario("3A", "Standalone desktop display-mode emulation", async () => {
    const browser = await chromium.launch({
      headless: true,
      args: [`--app=${BASE_URL}/`],
    });
    const context = await browser.newContext({
      colorScheme: "light",
      viewport: { width: 1280, height: 800 },
    });
    await context.addInitScript(() => {
      window.matchMedia = (query) => ({
        matches: query.includes("display-mode: standalone"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });
    });
    const page = await context.newPage();
    return { browser, context, page };
  })
);

// SCENARIO 3B: Standalone mobile emulation (Pixel 7 standalone)
scenarioReports.push(
  await runScenario("3B", "Standalone mobile emulation (Pixel 7)", async () => {
    const pixel = devices["Pixel 7"] || devices["Pixel 5"];
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      ...pixel,
      isMobile: true,
      hasTouch: true,
    });
    await context.addInitScript(() => {
      window.matchMedia = (query) => ({
        matches: query.includes("display-mode: standalone"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });
    });
    const page = await context.newPage();
    return { browser, context, page };
  })
);

// SCENARIO 3C: Standalone mobile emulation (iPhone 14 standalone iOS)
scenarioReports.push(
  await runScenario("3C", "Standalone mobile emulation (iPhone 14 standalone iOS)", async () => {
    const iphone = devices["iPhone 14"] || devices["iPhone 13"];
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      ...iphone,
      isMobile: true,
      hasTouch: true,
    });
    await context.addInitScript(() => {
      window.navigator.standalone = true;
      window.matchMedia = (query) => ({
        matches: query.includes("display-mode: standalone"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });
    });
    const page = await context.newPage();
    return { browser, context, page };
  })
);

// SCENARIO 4: UPGRADE path: old SW (v1) -> new SW (v2)
scenarioReports.push(
  await runScenario("4", "UPGRADE path: old v1 SW -> new v2 SW", async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      const cache = await caches.open("melktoday-map-tiles-v1");
      await cache.put(
        "https://tile.openstreetmap.org/12/2632/1638.png",
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-type": "image/png" },
        })
      );
    });

    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await reg.update();
    });
    await page.waitForTimeout(2000);

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const cachesList = await page.evaluate(() => caches.keys());
    console.log("[Scenario 4] Active Cache Storage Names after upgrade:", cachesList);

    return { browser, context, page };
  })
);

// SCENARIO 5: Cold PWA launch with empty Cache Storage
scenarioReports.push(
  await runScenario("5", "Cold PWA launch with empty Cache Storage", async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      const keys = await caches.keys();
      for (const k of keys) await caches.delete(k);
    });
    return { browser, context, page };
  })
);

// SCENARIO 6: Offline launch after a warm cache
scenarioReports.push(
  await runScenario("6", "Offline launch after warm cache", async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Warm up the cache by visiting the map
    await page.goto(`${BASE_URL}/ads?view=map&mapdebug=1`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    // 2. Disconnect network
    await context.setOffline(true);

    // 3. Test that SW serves cached tiles while offline
    const offlineTestResult = await page.evaluate(async () => {
      try {
        const res = await fetch("/api/tiles/12/2632/1638.png");
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log("[Scenario 6] Offline tile fetch result:", offlineTestResult);

    return { browser, context, page, skipNavigation: true };
  })
);

// SCENARIO 7: start_url / scope launch from manifest (open '/' then navigate to '/ads')
scenarioReports.push(
  await runScenario("7", "start_url / scope launch from manifest (open '/' then navigate to '/ads')", async () => {
    const pixel = devices["Pixel 7"] || devices["Pixel 5"];
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      ...pixel,
      isMobile: true,
      hasTouch: true,
    });
    await context.addInitScript(() => {
      window.matchMedia = (query) => ({
        matches: query.includes("display-mode: standalone"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });
    });

    const page = await context.newPage();

    // Open manifest start_url "/"
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Dismiss welcome modal if open
    const modalClose = page.locator('button:has-text("متوجه شدم"), button[aria-label="بستن"]');
    if ((await modalClose.count()) > 0) {
      await modalClose.first().click({ force: true });
      await page.waitForTimeout(500);
    }

    // Direct navigate to /ads
    await page.goto(`${BASE_URL}/ads?mapdebug=1`, { waitUntil: "networkidle" });

    return { browser, context, page, skipNavigation: true };
  })
);

const summaryFile = path.join(OUTPUT_DIR, "scenarios-summary.json");
await fs.writeFile(summaryFile, JSON.stringify(scenarioReports, null, 2), "utf8");
console.log(`\nAll scenarios complete! Summary written to: ${summaryFile}`);
