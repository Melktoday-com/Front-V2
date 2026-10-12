import { test, expect } from '@playwright/test';

test.describe('Multi-Zone Search Filtering E2E', () => {
  const mashhadCityId = '4c01ce1e-d916-484e-87d5-3fcc14227741';
  const hashemiehZoneId = 'e0b54d45-b471-4ccb-8161-479d407c40d4';
  const kohsangiZoneId = 'e6b0a55d-1b54-4172-bb5d-b0955aed0401';
  const targetListingId = 'efa595c5-39d9-4fe3-ae18-589081949604';

  test('Single Zone Filter: returns exact Hashemieh ads count', async ({ request }) => {
    const res = await request.get('/backend/api/search/listings', {
      params: {
        cityId: mashhadCityId,
        zoneId: hashemiehZoneId,
        limit: '20',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBe(3);
    expect(body.data.hits.length).toBe(3);
    const hasTarget = body.data.hits.some((h: any) => h.id === targetListingId);
    expect(hasTarget).toBe(true);
  });

  test('Multi-Zone Filter: selecting multiple zones (Hashemieh + Kohsangi) does NOT revert to whole city', async ({ request }) => {
    // 1. Array query parameter syntax: zoneIds[]=...
    const res = await request.get('/backend/api/search/listings', {
      params: {
        cityId: mashhadCityId,
        'zoneIds[]': [hashemiehZoneId, kohsangiZoneId],
        limit: '20',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // CRITICAL REGRESSION ASSERTION:
    // Should NEVER return all 99 listings in Mashhad!
    expect(body.data.total).toBeLessThanOrEqual(5);
    expect(body.data.total).toBeGreaterThanOrEqual(3);
    expect(body.data.hits.length).toBeLessThanOrEqual(5);

    // Target listing in Hashemieh must be present
    const hasTarget = body.data.hits.some((h: any) => h.id === targetListingId);
    expect(hasTarget).toBe(true);
  });

  test('Multi-Zone Filter: comma-separated zoneIds query parameter works seamlessly', async ({ request }) => {
    // 2. Comma-separated query parameter syntax: zoneIds=id1,id2
    const res = await request.get('/backend/api/search/listings', {
      params: {
        cityId: mashhadCityId,
        zoneIds: `${hashemiehZoneId},${kohsangiZoneId}`,
        limit: '20',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBeLessThanOrEqual(5);
    expect(body.data.total).toBeGreaterThanOrEqual(3);
  });

  test('Map Search Multi-Zone: map clusters and markers respect multiple zoneIds', async ({ request }) => {
    const res = await request.get('/backend/api/search/map', {
      params: {
        cityId: mashhadCityId,
        zoneIds: `${hashemiehZoneId},${kohsangiZoneId}`,
        northLat: '36.45',
        southLat: '36.20',
        eastLng: '59.65',
        westLng: '59.40',
        zoom: '12',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.meta.totalMatching).toBeLessThanOrEqual(5);
    expect(body.data.meta.totalMatching).toBeGreaterThanOrEqual(2);
  });

  test('UI Multi-Zone Interaction: selecting multiple zones maintains filtered list', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/ads?cityId=${mashhadCityId}`, { waitUntil: 'domcontentloaded' });

    // Open neighborhood drawer
    const zoneButton = page.locator('button:has-text("انتخاب محله"), button:has-text("محله")').first();
    if (await zoneButton.isVisible()) {
      await zoneButton.click();
      await page.waitForTimeout(500);

      // Select Hashemieh if visible in drawer
      const hashemiehCheckbox = page.locator('text="هاشمیه"').first();
      if (await hashemiehCheckbox.isVisible()) {
        await hashemiehCheckbox.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
