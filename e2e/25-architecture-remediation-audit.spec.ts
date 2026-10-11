import { test, expect } from '@playwright/test';

test.describe('Full-Stack Architecture Remediation & Live Audit Verification', () => {
  const sampleAdId = '52e3820b-c52e-48c7-af81-a09e6daf1069';

  test('Issue A & G: SSR HTML renders dynamic SEO metadata and Persian labels', async ({ page }) => {
    // Navigate directly to ad detail page
    const response = await page.goto(`/ads/${sampleAdId}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Verify Title
    await expect(page).toHaveTitle(/فروش فوری \| ملک تودی/);

    // Verify Meta Tags rendered in DOM
    const descriptionMeta = page.locator('meta[name="description"]');
    await expect(descriptionMeta).toHaveAttribute('content', /ببببببب/);

    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', new RegExp(`/ads/${sampleAdId}`));

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /فروش فوری \| ملک تودی/);

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /media\/f4c547d4/);

    // Verify Persian labels in attributes
    await expect(page.locator('body')).toContainText('فروش مسکونی');
  });

  test('Issue C: Viewport bounding box map search API returns markers', async ({ request }) => {
    const res = await request.get('/backend/api/search/map', {
      params: {
        northLat: '37.0',
        southLat: '35.0',
        eastLng: '60.0',
        westLng: '58.0',
        limit: '10',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.markers)).toBe(true);
    expect(body.data.markers.length).toBeGreaterThan(0);
    const firstMarker = body.data.markers[0];
    expect(typeof firstMarker.latitude).toBe('number');
    expect(typeof firstMarker.longitude).toBe('number');
    expect(firstMarker.id).toBeTruthy();
  });

  test('Issue D: Desktop view mode toggles between list, split, and full-width map', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/ads', { waitUntil: 'networkidle' });

    const listContainer = page.locator('#ads-list-container');
    const mapContainer = page.locator('.leaflet-container').first();

    // Default or split mode: both should be visible on desktop
    await expect(listContainer).toBeVisible({ timeout: 10000 });
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Switch to Map full-width mode
    const mapToggleBtn = page.getByRole('button', { name: 'نقشه' }).first();
    await mapToggleBtn.click();
    await page.waitForTimeout(500);

    // In full-width map mode, listContainer must be hidden
    await expect(listContainer).toBeHidden();
    await expect(mapContainer).toBeVisible();

    // Switch to List mode
    const listToggleBtn = page.getByRole('button', { name: 'فهرست' }).first();
    await listToggleBtn.click();
    await page.waitForTimeout(500);

    // In list mode, map container must be hidden, list visible
    await expect(listContainer).toBeVisible();
    await expect(mapContainer).toBeHidden();

    // Switch back to Split mode
    const splitToggleBtn = page.getByRole('button', { name: 'تقسیم' }).first();
    await splitToggleBtn.click();
    await page.waitForTimeout(500);

    await expect(listContainer).toBeVisible();
    await expect(mapContainer).toBeVisible();
  });

  test('Issue B & F: Persian search in Meilisearch returns relevant listings', async ({ request }) => {
    const res = await request.get('/backend/api/search/listings', {
      params: {
        query: 'مشهد',
        limit: '5',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.hits.length).toBeGreaterThan(0);
    const firstHit = body.data.hits[0];
    expect(firstHit.searchText).toContain('مشهد');
    expect(firstHit.geo.provinceName).toBe('خراسان رضوی');
  });

  test('Issue A: Ad detail API returns complete localized attributeList', async ({ request }) => {
    const res = await request.get(`/backend/api/ads/${sampleAdId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const ad = body.data;

    // Check location labels
    expect(ad.province).toEqual(expect.objectContaining({ id: expect.any(String), label: 'خراسان رضوی' }));
    expect(ad.city).toEqual(expect.objectContaining({ id: expect.any(String), label: 'مشهد' }));
    expect(ad.category).toEqual(expect.objectContaining({ id: 'residential_sale', label: 'فروش مسکونی' }));

    // Check attributeList with Persian labels
    expect(Array.isArray(ad.attributeList)).toBe(true);
    expect(ad.attributeList.length).toBeGreaterThan(0);
    const areaAttr = ad.attributeList.find((a: any) => a.key === 'area');
    expect(areaAttr).toEqual(expect.objectContaining({
      key: 'area',
      label: 'متراژ',
      value: expect.any(String),
      displayValue: expect.any(String),
    }));
  });
});
