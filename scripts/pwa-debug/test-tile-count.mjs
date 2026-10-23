import { chromium, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3008";
const pixel = devices["Pixel 7"] || devices["Pixel 5"];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...pixel,
  isMobile: true,
  hasTouch: true,
});

const page = await context.newPage();
await page.goto(`${BASE_URL}/ads?mapdebug=1`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// Check initial Leaflet size
const initialLeaflet = await page.evaluate(() => {
  const mapEl = document.querySelector(".leaflet-container");
  return {
    mapElFound: Boolean(mapEl),
    clientWidth: mapEl?.clientWidth,
    clientHeight: mapEl?.clientHeight,
  };
});
console.log("Initial Map element:", initialLeaflet);

// Click toggle button
const mapToggleBtn = page.locator('button:has-text("مشاهده روی نقشه")');
await mapToggleBtn.click({ force: true });
await page.waitForTimeout(500);

const afterToggle = await page.evaluate(() => {
  const mapEl = document.querySelector(".leaflet-container");
  const tileImgs = Array.from(document.querySelectorAll("img.leaflet-tile"));
  return {
    clientWidth: mapEl?.clientWidth,
    clientHeight: mapEl?.clientHeight,
    totalTilesInDOM: tileImgs.length,
    tileSrcs: tileImgs.map((img) => img.src),
    debugLogs: window.__mapDebugLogs?.slice(-10),
  };
});
console.log("After toggle details:", afterToggle);

await page.waitForTimeout(2000);

const afterWait = await page.evaluate(() => {
  const tileImgs = Array.from(document.querySelectorAll("img.leaflet-tile"));
  const loadedTiles = Array.from(document.querySelectorAll("img.leaflet-tile-loaded"));
  return {
    totalTilesInDOM: tileImgs.length,
    loadedTiles: loadedTiles.length,
    tileSrcs: tileImgs.map((img) => img.src),
  };
});
console.log("After 2s wait:", afterWait);

await browser.close();
