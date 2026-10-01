import { test, expect } from '@playwright/test';

test.describe('Flow 22: Ads Map Zones & Boundaries Rendering E2E Verification', () => {
  test('Mashhad city map loads all zones (>100), renders clean solid boundaries without black outline on click', async ({
    page,
  }) => {
    // 1. Intercept network request for city zones
    let zonesResponseReceived = false;
    let fetchedZonesCount = 0;

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/geo/zones') && url.includes('type=NEIGHBORHOOD')) {
        zonesResponseReceived = true;
        try {
          const data = await response.json();
          const items = data.zones || data.items || [];
          fetchedZonesCount = items.length;
          console.log(`[E2E Map Test] Fetched ${fetchedZonesCount} zones from backend API. Total in backend: ${data.total}`);
        } catch {
          // ignore
        }
      }
    });

    // 2. Navigate to /ads with Mashhad city selected
    const mashhadCityId = '4c01ce1e-d916-484e-87d5-3fcc14227741';
    await page.goto(`/ads?cityId=${mashhadCityId}&cityName=مشهد`, {
      waitUntil: 'networkidle',
    });

    // 3. Verify page loaded
    await expect(page).toHaveURL(/\/ads/);

    // 4. Wait for zones API response
    await page.waitForTimeout(2000);
    expect(zonesResponseReceived).toBe(true);
    expect(fetchedZonesCount).toBeGreaterThan(100);

    // 5. Verify Leaflet map container is visible
    const mapContainer = page.locator('.leaflet-container').first();
    await expect(mapContainer).toBeVisible({ timeout: 15000 });

    // 6. Verify SVG polygon paths are rendered on the map
    const polygonPaths = page.locator('path.leaflet-interactive');
    const pathCount = await polygonPaths.count();
    console.log(`[E2E Map Test] Rendered ${pathCount} interactive polygon paths on the map.`);
    expect(pathCount).toBeGreaterThan(100);

    // 7. Click on a zone polygon to test selection and focus outline
    const firstPolygon = polygonPaths.first();
    await firstPolygon.click({ force: true });
    await page.waitForTimeout(500);

    // 8. Verify the clicked polygon does not have an ugly black outline
    const outlineStyle = await firstPolygon.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth,
        outlineColor: computed.outlineColor,
        stroke: computed.stroke,
        strokeWidth: computed.strokeWidth,
      };
    });

    console.log(`[E2E Map Test] Polygon computed outline style:`, JSON.stringify(outlineStyle));
    // outlineStyle should be 'none' or outlineWidth '0px'
    expect(outlineStyle.outlineStyle === 'none' || outlineStyle.outlineWidth === '0px').toBe(true);

    // 9. Verify selected zones count or tag exists in UI
    const zoneBadge = page.locator('button:has-text("نواحی") span').first();
    if (await zoneBadge.isVisible()) {
      const badgeText = await zoneBadge.innerText();
      console.log(`[E2E Map Test] Selected zone count badge: ${badgeText}`);
      expect(parseInt(badgeText, 10)).toBeGreaterThanOrEqual(1);
    }

    console.log('[E2E Map Test] Map zone rendering verification passed successfully!');
  });
});
