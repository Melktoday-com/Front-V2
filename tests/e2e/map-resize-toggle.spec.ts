import { test, expect } from "@playwright/test";

test.describe("Map Container Resize & Visibility in Standalone/Mobile PWA", () => {
  test("map loads all viewport tiles after transitioning from hidden to visible", async ({
    page,
    context,
  }) => {
    // 1. Emulate standalone mobile display mode (e.g. Pixel/iPhone)
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

    // 2. Load /ads (which on mobile viewport <=1023px defaults to list view, map container hidden)
    await page.goto("http://localhost:3008/ads?mapdebug=1", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 3. Verify initial state: map container exists but has 0x0 size
    const initialSize = await page.evaluate(() => {
      const el = document.querySelector(".leaflet-container");
      return el ? { width: el.clientWidth, height: el.clientHeight } : null;
    });
    expect(initialSize?.width).toBe(0);
    expect(initialSize?.height).toBe(0);

    // 4. Click the "مشاهده روی نقشه" toggle button to display the map
    const toggleBtn = page.locator('button:has-text("مشاهده روی نقشه"), button[title="نمایش تمام‌صفحه نقشه"]');
    await expect(toggleBtn.first()).toBeVisible();
    await toggleBtn.first().click();

    // 5. Wait for map container to become visible with non-zero size
    await page.waitForFunction(() => {
      const el = document.querySelector(".leaflet-container");
      return el && el.clientWidth > 100 && el.clientHeight > 100;
    }, { timeout: 5000 });

    // 6. Give Leaflet a moment to request and render tiles for the new viewport
    await page.waitForTimeout(2000);

    // 7. Verify tile loading: a 390x844 viewport requires at least 6-12 tiles
    // In the buggy state, only 1 tile was loaded because ResizeObserver deadlocked on map.getSize() > 0
    const loadedTiles = await page.locator("img.leaflet-tile-loaded").count();
    console.log(`[Regression Test] Loaded tiles count after toggle: ${loadedTiles}`);

    expect(loadedTiles).toBeGreaterThanOrEqual(6);
  });
});
