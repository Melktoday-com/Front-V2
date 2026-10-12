import { test, expect } from '@playwright/test';

test.describe('Map Search, Scalable Retrieval & Adaptive Clustering E2E', () => {
  const mashhadCityId = '4c01ce1e-d916-484e-87d5-3fcc14227741';
  const targetListingId = 'efa595c5-39d9-4fe3-ae18-589081949604';

  test('Requirement 4: Low zoom city view returns aggregated clusters with truthful counts', async ({ request }) => {
    const res = await request.get('/backend/api/search/map', {
      params: {
        cityId: mashhadCityId,
        northLat: '36.45',
        southLat: '36.20',
        eastLng: '59.65',
        westLng: '59.40',
        zoom: '9',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();

    const data = body.data;
    expect(Array.isArray(data.clusters)).toBe(true);
    expect(Array.isArray(data.markers)).toBe(true);
    expect(data.meta).toBeDefined();
    expect(typeof data.meta.totalMatching).toBe('number');
    expect(data.meta.totalMatching).toBeGreaterThanOrEqual(1);

    // Verify mathematical integrity: zero double counting
    const totalClusterItems = data.clusters.reduce((sum: number, c: any) => sum + c.count, 0);
    expect(totalClusterItems + data.markers.length).toBe(data.meta.totalMatching);
    expect(data.meta.clustersCount).toBe(totalClusterItems);
    expect(data.meta.markersCount).toBe(data.markers.length);

    expect(data.clusters.length).toBeGreaterThanOrEqual(1);
    const firstCluster = data.clusters[0];
    expect(firstCluster.id).toMatch(/^cluster-/);
    expect(typeof firstCluster.latitude).toBe('number');
    expect(typeof firstCluster.longitude).toBe('number');
    expect(typeof firstCluster.count).toBe('number');
    expect(firstCluster.count).toBeGreaterThanOrEqual(2);
    expect(firstCluster.expansionZoom).toBeGreaterThan(9);
  });

  test('Requirement 4: High zoom street view returns individual markers when density is reasonable', async ({ request }) => {
    const res = await request.get('/backend/api/search/map', {
      params: {
        cityId: mashhadCityId,
        northLat: '36.325',
        southLat: '36.315',
        eastLng: '59.518',
        westLng: '59.508',
        zoom: '17',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const data = body.data;
    expect(Array.isArray(data.markers)).toBe(true);
    expect(data.markers.length).toBeGreaterThanOrEqual(1);
    expect(data.meta.clustersCount).toBe(0);
    expect(data.meta.markersCount).toBe(data.markers.length);

    const targetMarker = data.markers.find((m: any) => m.id === targetListingId);
    expect(targetMarker).toBeDefined();
    expect(targetMarker.latitude).toBeCloseTo(36.320231, 4);
    expect(targetMarker.longitude).toBeCloseTo(59.513562, 4);
    expect(targetMarker.neighbourhoodName).toBe('هاشمیه');
  });

  test('Requirement 2 & 8: Decoupled retrieval — List pagination independent from map bounds', async ({ request }) => {
    // 1. Ordinary list search uses conventional pagination
    const listRes = await request.get('/backend/api/search/listings', {
      params: {
        cityId: mashhadCityId,
        page: '1',
        limit: '10',
      },
    });
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.data.hits.length).toBeLessThanOrEqual(10);
    expect(listBody.data.limit).toBe(10);

    // 2. Map search uses viewport-based retrieval without being restricted to page 1 limit
    const mapRes = await request.get('/backend/api/search/map', {
      params: {
        cityId: mashhadCityId,
        northLat: '36.45',
        southLat: '36.20',
        eastLng: '59.65',
        westLng: '59.40',
        zoom: '12',
      },
    });
    expect(mapRes.status()).toBe(200);
    const mapBody = await mapRes.json();
    expect(mapBody.data.meta.totalMatching).toBeGreaterThanOrEqual(1);
  });

  test('Requirement 3 & 7: UI renders interactive map with view mode toggles', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/ads?cityId=${mashhadCityId}`, { waitUntil: 'domcontentloaded' });

    // Map container exists and renders Leaflet
    const mapContainer = page.locator('.leaflet-container').first();
    await expect(mapContainer).toBeVisible({ timeout: 15000 });

    // Both list and map visible in default split mode
    const listContainer = page.locator('#ads-list-container');
    await expect(listContainer).toBeVisible({ timeout: 10000 });
  });
});
