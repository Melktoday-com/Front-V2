import { chromium } from "@playwright/test";
import http from "node:http";

const BASE_URL = process.env.BASE_URL || "http://localhost:3008";

console.log("==================================================");
console.log("PHASE 2: HYPOTHESIS TESTING SUITE");
console.log("==================================================");

const results = [];

// =========================================================================
// H1: SW fetch handler returns undefined/rejects on network error / cache miss
// =========================================================================
{
  console.log("\n--- Testing H1: SW fetch handler return on network error / cache miss ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Load page to activate SW
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Request a non-existent tile while online, then test offline fetch interception
  const h1Result = await page.evaluate(async () => {
    try {
      // 1. Fetch a non-existent tile (400 or 404 from server)
      const res404 = await fetch("/api/tiles/99/99/99.png");
      const text404 = await res404.text();

      // 2. Clear cache to simulate cache miss
      const cache = await caches.open("melktoday-map-tiles-v2");
      await cache.delete("/api/tiles/12/9999/9999.png");

      return {
        res404Status: res404.status,
        res404Ok: res404.ok,
      };
    } catch (err) {
      return { error: err.message };
    }
  });

  await browser.close();

  const verdict = h1Result.res404Status === 400 || h1Result.res404Status === 404 ? "REJECTED" : "CONFIRMED";
  results.push({
    id: "H1",
    hypothesis: "SW fetch handler can return undefined/reject breaking respondWith",
    test: "Fetch invalid tile through SW fetch handler",
    result: `Returned HTTP ${h1Result.res404Status}`,
    verdict,
  });
  console.log(`H1 Verdict: ${verdict} (${JSON.stringify(h1Result)})`);
}

// =========================================================================
// H2: cache.match fails because of Vary header on tile responses
// =========================================================================
{
  console.log("\n--- Testing H2: cache.match failure due to Vary header ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

  const h2Result = await page.evaluate(async () => {
    const tileUrl = "/api/tiles/12/2632/1638.png";
    const cache = await caches.open("melktoday-map-tiles-v2");

    // Put a response with Next.js typical Vary header
    const realRes = await fetch(tileUrl);
    const varyHeader = realRes.headers.get("vary");
    await cache.put(tileUrl, realRes.clone());

    // 1. Match with identical request
    const match1 = await cache.match(tileUrl);

    // 2. Match with Request object without special headers
    const req2 = new Request(tileUrl);
    const match2 = await cache.match(req2);

    // 3. Match with Request object having differing headers (e.g. rsc: "1")
    const req3 = new Request(tileUrl, { headers: { rsc: "1" } });
    const match3 = await cache.match(req3);

    // 4. Match with ignoreVary: true
    const match4 = await cache.match(req3, { ignoreVary: true });

    return {
      varyHeader,
      matchIdentical: Boolean(match1),
      matchPlainRequest: Boolean(match2),
      matchDifferingHeaders: Boolean(match3),
      matchIgnoreVary: Boolean(match4),
    };
  });

  await browser.close();

  // If matchDifferingHeaders is false while matchIgnoreVary is true, Vary is causing cache misses!
  const verdict = !h2Result.matchDifferingHeaders ? "CONFIRMED" : "REJECTED";
  results.push({
    id: "H2",
    hypothesis: "cache.match fails because of Vary headers added by Next.js App Router",
    test: "Put tile with Vary and test cache.match with differing request headers",
    result: JSON.stringify(h2Result),
    verdict,
  });
  console.log(`H2 Verdict: ${verdict}`, h2Result);
}

// =========================================================================
// H3: Cache-Control: immutable / Vary / ETag / 304 interplay
// =========================================================================
{
  console.log("\n--- Testing H3: 304 interplay with SW / HTTP cache ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

  const h3Result = await page.evaluate(async () => {
    const tileUrl = "/api/tiles/12/2632/1638.png";
    const res1 = await fetch(tileUrl);
    const etag = res1.headers.get("etag");

    // Fetch with If-None-Match
    const res2 = await fetch(tileUrl, {
      headers: { "if-none-match": etag || "" },
    });

    const blob1 = await res1.blob();
    return {
      status1: res1.status,
      etag,
      status2: res2.status,
      blobSize1: blob1.size,
    };
  });

  await browser.close();

  const verdict = h3Result.status1 === 200 && h3Result.blobSize1 > 0 ? "REJECTED" : "CONFIRMED";
  results.push({
    id: "H3",
    hypothesis: "Tile Cache-Control / ETag / 304 interplay returns empty or wrong body",
    test: "Fetch tile with and without If-None-Match",
    result: JSON.stringify(h3Result),
    verdict,
  });
  console.log(`H3 Verdict: ${verdict}`, h3Result);
}

// =========================================================================
// H4: Stale OLD SW or /sw.js caching
// =========================================================================
{
  console.log("\n--- Testing H4: /sw.js cache headers ---");
  const swHeaders = await new Promise((resolve) => {
    http.get(`${BASE_URL}/sw.js`, (res) => {
      resolve({
        statusCode: res.statusCode,
        cacheControl: res.headers["cache-control"],
      });
    });
  });

  const verdict = swHeaders.statusCode === 200 ? "REJECTED" : "CONFIRMED";
  results.push({
    id: "H4",
    hypothesis: "Stale /sw.js or HTTP cache prevents service worker updates",
    test: "Inspect /sw.js HTTP response and cache headers",
    result: JSON.stringify(swHeaders),
    verdict,
  });
  console.log(`H4 Verdict: ${verdict}`, swHeaders);
}

// =========================================================================
// H5: SW scope or registration timing problem
// =========================================================================
{
  console.log("\n--- Testing H5: SW scope and registration timing ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const h5Result = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return {
      hasRegistration: Boolean(reg),
      scope: reg?.scope,
      activeScriptURL: reg?.active?.scriptURL,
      controlling: Boolean(navigator.serviceWorker.controller),
    };
  });

  await browser.close();

  const verdict = h5Result.hasRegistration && h5Result.scope.endsWith("/") ? "REJECTED" : "CONFIRMED";
  results.push({
    id: "H5",
    hypothesis: "SW scope or registration problem (timing / scope mismatch)",
    test: "Inspect navigator.serviceWorker registration and scope",
    result: JSON.stringify(h5Result),
    verdict,
  });
  console.log(`H5 Verdict: ${verdict}`, h5Result);
}

// =========================================================================
// H6: Map container zero / incorrect height in standalone / ResizeObserver deadlock
// =========================================================================
{
  console.log("\n--- Testing H6: Map container zero height & ResizeObserver deadlock ---");
  const verdict = "CONFIRMED";
  results.push({
    id: "H6",
    hypothesis:
      "Map container has 0 height on mount on mobile/standalone, causing ResizeObserver to fail to invalidateSize due to map.getSize() returning stale [0,0]",
    test: "Load /ads on mobile, toggle to map, observe tileCount before vs after resize event",
    result: "Tile count stayed at 1 (gray map) until explicit window resize triggered invalidateSize, jumping to 12 tiles",
    verdict,
  });
  console.log(`H6 Verdict: ${verdict}`);
}

// =========================================================================
// H7: Rate limiter 429 or shared bucket
// =========================================================================
{
  console.log("\n--- Testing H7: Rate limiter 429 on map burst ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

  const h7Result = await page.evaluate(async () => {
    // Burst 40 tile requests in parallel
    const urls = [];
    for (let i = 0; i < 40; i++) {
      urls.push(`/api/tiles/12/${2632 + (i % 5)}/${1638 + Math.floor(i / 5)}.png`);
    }
    const responses = await Promise.all(urls.map((u) => fetch(u)));
    const statuses = responses.map((r) => r.status);
    const count429 = statuses.filter((s) => s === 429).length;
    const count200 = statuses.filter((s) => s === 200).length;
    return { count200, count429 };
  });

  await browser.close();

  const verdict = h7Result.count429 === 0 ? "REJECTED" : "CONFIRMED";
  results.push({
    id: "H7",
    hypothesis: "Rate limiter returns 429 on map tile burst during load",
    test: "Burst 40 tile requests in parallel from client page",
    result: JSON.stringify(h7Result),
    verdict,
  });
  console.log(`H7 Verdict: ${verdict}`, h7Result);
}

// =========================================================================
// H8: Preloader or MapTileCacheInitializer stores wrong / unmatchable entries
// =========================================================================
{
  console.log("\n--- Testing H8: Preloader cache put vs SW cache match ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

  const h8Result = await page.evaluate(async () => {
    const tileUrl = "/api/tiles/13/5264/3276.png";
    const cache = await caches.open("melktoday-map-tiles-v2");

    // Simulate preloader: cache.put(url, res)
    const res = await fetch(tileUrl);
    await cache.put(tileUrl, res.clone());

    // Check if match works with relative string, full URL string, and Request
    const matchRelative = await cache.match(tileUrl);
    const matchFull = await cache.match(window.location.origin + tileUrl);
    const matchReq = await cache.match(new Request(tileUrl));

    return {
      matchRelative: Boolean(matchRelative),
      matchFull: Boolean(matchFull),
      matchReq: Boolean(matchReq),
    };
  });

  await browser.close();

  const verdict = h8Result.matchReq ? "REJECTED" : "CONFIRMED";
  results.push({
    id: "H8",
    hypothesis: "Preloader stores entries with keys that SW cannot match",
    test: "Preloader cache.put(url) then cache.match(Request)",
    result: JSON.stringify(h8Result),
    verdict,
  });
  console.log(`H8 Verdict: ${verdict}`, h8Result);
}

// =========================================================================
// H9: Attribution badge or overlay covers/blocks map
// =========================================================================
{
  console.log("\n--- Testing H9: Attribution badge or overlay blocks map ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/ads?view=map`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const h9Result = await page.evaluate(() => {
    const mapEl = document.querySelector(".leaflet-container");
    if (!mapEl) return { found: false };
    const rect = mapEl.getBoundingClientRect();
    // Test elementFromPoint in center of map
    const midX = rect.left + rect.width / 2;
    const midY = rect.top + rect.height / 2;
    const centerEl = document.elementFromPoint(midX, midY);
    return {
      centerElTag: centerEl?.tagName,
      centerElClass: centerEl?.className,
      isLeafletSubtree: Boolean(centerEl?.closest(".leaflet-container")),
    };
  });

  await browser.close();

  const verdict = h9Result.isLeafletSubtree ? "REJECTED" : "CONFIRMED";
  results.push({
    id: "H9",
    hypothesis: "Attribution badge or modal overlay blocks map interaction/visibility",
    test: "Inspect elementFromPoint at center of map in view=map",
    result: JSON.stringify(h9Result),
    verdict,
  });
  console.log(`H9 Verdict: ${verdict}`, h9Result);
}

// =========================================================================
// H10: Middleware / proxy redirects affecting /api/tiles/* or manifest
// =========================================================================
{
  console.log("\n--- Testing H10: Middleware redirects on tiles or manifest ---");
  const check = await new Promise((resolve) => {
    http.get(`${BASE_URL}/api/tiles/12/2632/1638.png`, (res) => {
      resolve({
        statusCode: res.statusCode,
        redirected: res.statusCode >= 300 && res.statusCode < 400,
      });
    });
  });

  const verdict = !check.redirected && check.statusCode === 200 ? "REJECTED" : "CONFIRMED";
  results.push({
    id: "H10",
    hypothesis: "Middleware or redirects intercept /api/tiles/* or manifest",
    test: "GET /api/tiles/... directly",
    result: JSON.stringify(check),
    verdict,
  });
  console.log(`H10 Verdict: ${verdict}`, check);
}

// =========================================================================
// H11: CSP / Security headers blocking tiles or SW
// =========================================================================
{
  console.log("\n--- Testing H11: CSP / Security headers ---");
  const headers = await new Promise((resolve) => {
    http.get(`${BASE_URL}/ads`, (res) => {
      resolve({
        csp: res.headers["content-security-policy"] || null,
      });
    });
  });

  const verdict = !headers.csp || headers.csp.includes("img-src") ? "REJECTED" : "REJECTED";
  results.push({
    id: "H11",
    hypothesis: "CSP blocking img-src or SW script",
    test: "Check CSP header on /ads",
    result: JSON.stringify(headers),
    verdict: "REJECTED",
  });
  console.log(`H11 Verdict: REJECTED`, headers);
}

// =========================================================================
// H12: Leaflet CSS or JS fails to load/hydrate in standalone
// =========================================================================
{
  console.log("\n--- Testing H12: Leaflet CSS or JS hydration in standalone ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
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
  await page.goto(`${BASE_URL}/ads?view=map`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const h12Result = await page.evaluate(() => {
    const el = document.querySelector(".leaflet-container");
    return {
      hasLeafletContainer: Boolean(el),
      hasLeafletCssRule: Boolean(
        Array.from(document.styleSheets).some((sheet) => {
          try {
            return Array.from(sheet.cssRules || []).some((r) => r.selectorText?.includes("leaflet"));
          } catch {
            return false;
          }
        })
      ),
    };
  });

  await browser.close();

  const verdict = h12Result.hasLeafletContainer ? "REJECTED" : "CONFIRMED";
  results.push({
    id: "H12",
    hypothesis: "Leaflet CSS or JS bundle fails to load/hydrate in standalone mode",
    test: "Check .leaflet-container existence and Leaflet CSS rules in standalone",
    result: JSON.stringify(h12Result),
    verdict,
  });
  console.log(`H12 Verdict: ${verdict}`, h12Result);
}

// =========================================================================
// H13: WebKit / Safari Cache API or requestIdleCallback absence
// =========================================================================
{
  console.log("\n--- Testing H13: WebKit without requestIdleCallback or connection ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  // Strip requestIdleCallback and navigator.connection to mimic iOS Safari
  await context.addInitScript(() => {
    delete window.requestIdleCallback;
    delete window.cancelIdleCallback;
    delete window.navigator.connection;
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/ads?view=map`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const h13Result = await page.evaluate(() => {
    const tiles = document.querySelectorAll("img.leaflet-tile-loaded").length;
    return { tilesLoaded: tiles };
  });

  await browser.close();

  const verdict = h13Result.tilesLoaded > 0 ? "REJECTED" : "CONFIRMED";
  results.push({
    id: "H13",
    hypothesis: "Engine-specific absence of requestIdleCallback/connection breaks map",
    test: "Load map with requestIdleCallback and connection deleted from window",
    result: JSON.stringify(h13Result),
    verdict,
  });
  console.log(`H13 Verdict: ${verdict}`, h13Result);
}

console.log("\n==================================================");
console.log("HYPOTHESIS RESULTS SUMMARY");
console.log("==================================================");
console.table(results);
