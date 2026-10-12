import { test, expect } from '@playwright/test';

test.describe('Hashemieh Zone Filter & Geographic Membership Live E2E', () => {
  const targetListingId = 'efa595c5-39d9-4fe3-ae18-589081949604';
  const hashemiehZoneId = 'e0b54d45-b471-4ccb-8161-479d407c40d4';
  const mashhadCityId = '4c01ce1e-d916-484e-87d5-3fcc14227741';

  test('Scenario A & B: Live search API returns target listing when filtering by Hashemieh zone', async ({ request }) => {
    // 1. By neighbourhoodName
    const resByName = await request.get('/backend/api/search/listings', {
      params: {
        cityId: mashhadCityId,
        neighbourhoodName: 'هاشمیه',
      },
    });
    expect(resByName.status()).toBe(200);
    const bodyByName = await resByName.json();
    expect(bodyByName.success).toBe(true);
    expect(bodyByName.data.total).toBeGreaterThanOrEqual(1);
    const hitByName = bodyByName.data.hits.find((h: any) => h.id === targetListingId);
    expect(hitByName).toBeDefined();
    expect(hitByName.geo.neighbourhoodName).toBe('هاشمیه');
    expect(hitByName.geo.zoneIds).toContain(hashemiehZoneId);

    // 2. By zoneId
    const resById = await request.get('/backend/api/search/listings', {
      params: {
        cityId: mashhadCityId,
        zoneId: hashemiehZoneId,
      },
    });
    expect(resById.status()).toBe(200);
    const bodyById = await resById.json();
    expect(bodyById.success).toBe(true);
    const hitById = bodyById.data.hits.find((h: any) => h.id === targetListingId);
    expect(hitById).toBeDefined();
  });

  test('Scenario C: Map search returns target listing marker with consistent geographic metadata', async ({ request }) => {
    const res = await request.get('/backend/api/search/map', {
      params: {
        cityId: mashhadCityId,
        zoneId: hashemiehZoneId,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(1);
    const marker = body.data.markers.find((m: any) => m.id === targetListingId);
    expect(marker).toBeDefined();
    expect(marker.latitude).toBeCloseTo(36.320231, 4);
    expect(marker.longitude).toBeCloseTo(59.513562, 4);
    expect(marker.neighbourhoodName).toBe('هاشمیه');
  });

  test('Scenario D: Non-overlapping zone (کوهسنگی) excludes target listing', async ({ request }) => {
    const res = await request.get('/backend/api/search/listings', {
      params: {
        cityId: mashhadCityId,
        neighbourhoodName: 'کوهسنگی',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const foundTarget = body.data.hits.some((h: any) => h.id === targetListingId);
    expect(foundTarget).toBe(false);
  });

  test('Scenario E: Ad detail page renders authoritative Persian location with zone name (هاشمیه)', async ({ page }) => {
    const response = await page.goto(`/ads/${targetListingId}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Verify title and location text
    await expect(page.locator('h1')).toContainText('120 متر آپارتمان هاشمیه');
    await expect(page.locator('body')).toContainText('خراسان رضوی، مشهد، هاشمیه');
  });
});
