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

// Click toggle button
const mapToggleBtn = page.locator('button:has-text("مشاهده روی نقشه")');
await mapToggleBtn.click({ force: true });
await page.waitForTimeout(500);

const beforeInvalidate = await page.evaluate(() => {
  return {
    tileCount: document.querySelectorAll("img.leaflet-tile").length,
  };
});
console.log("Before explicit invalidateSize, tileCount in DOM:", beforeInvalidate.tileCount);

// Now trigger window.dispatchEvent(new Event('resize')) or call invalidateSize
const afterWindowResize = await page.evaluate(async () => {
  window.dispatchEvent(new Event("resize"));
  await new Promise((r) => setTimeout(r, 1000));
  return {
    tileCount: document.querySelectorAll("img.leaflet-tile").length,
  };
});
console.log("After window resize event, tileCount in DOM:", afterWindowResize.tileCount);

await browser.close();
