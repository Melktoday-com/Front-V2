import { chromium, devices } from "@playwright/test";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3008";
const OUTPUT_DIR = path.resolve("scripts/pwa-debug/output");

const pixel = devices["Pixel 7"] || devices["Pixel 5"];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...pixel,
  isMobile: true,
  hasTouch: true,
});

await context.addInitScript(() => {
  window.matchMedia = (query) => {
    return {
      matches: query.includes("display-mode: standalone"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
});

const page = await context.newPage();

console.log("[Test Mobile] Navigating to /ads on mobile standalone...");
await page.goto(`${BASE_URL}/ads?mapdebug=1`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

let initialStats = await page.evaluate(() => {
  const el = document.querySelector(".leaflet-container");
  if (!el) return { found: false };
  const rect = el.getBoundingClientRect();
  const parent = el.parentElement ? el.parentElement.getBoundingClientRect() : null;
  return {
    found: true,
    width: rect.width,
    height: rect.height,
    parentWidth: parent?.width,
    parentHeight: parent?.height,
    parentDisplay: window.getComputedStyle(el.parentElement).display,
  };
});
console.log("[Test Mobile] Initial state on /ads:", initialStats);

// Screenshot initial
await page.screenshot({ path: path.join(OUTPUT_DIR, "mobile-initial.png") });

// Look for the "مشاهده روی نقشه" button (viewMode toggle)
console.log("[Test Mobile] Looking for map toggle button...");
const mapToggleBtn = page.locator('button:has-text("مشاهده روی نقشه"), button[title="نمایش تمام‌صفحه نقشه"]');
const btnCount = await mapToggleBtn.count();
console.log(`[Test Mobile] Found ${btnCount} map toggle buttons`);

if (btnCount > 0) {
  console.log("[Test Mobile] Clicking map toggle button to switch to viewMode=map...");
  await mapToggleBtn.first().click({ force: true });
  await page.waitForTimeout(1500);

  const afterStats = await page.evaluate(() => {
    const el = document.querySelector(".leaflet-container");
    if (!el) return { found: false };
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement ? el.parentElement.getBoundingClientRect() : null;
    const tiles = document.querySelectorAll("img.leaflet-tile-loaded").length;
    return {
      found: true,
      width: rect.width,
      height: rect.height,
      parentWidth: parent?.width,
      parentHeight: parent?.height,
      parentDisplay: window.getComputedStyle(el.parentElement).display,
      tilesLoaded: tiles,
    };
  });
  console.log("[Test Mobile] State AFTER clicking map toggle button:", afterStats);

  // Take screenshot after toggle
  await page.screenshot({ path: path.join(OUTPUT_DIR, "mobile-after-toggle.png") });
}

// Now test direct navigation to /ads?view=map
console.log("[Test Mobile] Navigating directly to /ads?view=map&mapdebug=1...");
await page.goto(`${BASE_URL}/ads?view=map&mapdebug=1`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const directViewStats = await page.evaluate(() => {
  const el = document.querySelector(".leaflet-container");
  if (!el) return { found: false };
  const rect = el.getBoundingClientRect();
  const parent = el.parentElement ? el.parentElement.getBoundingClientRect() : null;
  const tiles = document.querySelectorAll("img.leaflet-tile-loaded").length;
  return {
    found: true,
    width: rect.width,
    height: rect.height,
    parentWidth: parent?.width,
    parentHeight: parent?.height,
    parentDisplay: window.getComputedStyle(el.parentElement).display,
    tilesLoaded: tiles,
  };
});
console.log("[Test Mobile] State on direct /ads?view=map:", directViewStats);
await page.screenshot({ path: path.join(OUTPUT_DIR, "mobile-direct-view-map.png") });

await browser.close();
