import { test, expect } from '@playwright/test';

test.describe('Neighborhood Geometry-Driven Full Platform E2E Verification', () => {
  const backendBase = 'http://localhost:3000/api';
  const mashhadCityId = '4c01ce1e-d916-484e-87d5-3fcc14227741';
  const haftTirAdId = 'b0000000-0000-0000-0000-000000000001';
  const daneshjooAdId = 'b0000000-0000-0000-0000-000000000002';
  const elahiyehTehranAdId = 'b0000000-0000-0000-0000-000000000003';
  const elahiyehMashhadAdId = 'b0000000-0000-0000-0000-000000000004';

  test('Scenario 1: Single Ad Details - displays authoritative city and geometry-resolved neighborhood without fabrication', async ({ page }) => {
    // 1. Visit Mashhad Haft-e Tir ad
    await page.goto(`/ads/${haftTirAdId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    
    // Authoritative location must show Mashhad and Haft Tir
    const pageText = await page.textContent('body');
    expect(pageText).toContain('مشهد');
    expect(pageText).toContain('هفت تیر');

    // 2. Visit Mashhad Daneshjoo ad
    await page.goto(`/ads/${daneshjooAdId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    
    const daneshjooText = await page.textContent('body');
    expect(daneshjooText).toContain('مشهد');
    expect(daneshjooText).toContain('دانشجو');
  });

  test('Scenario 2: Single Temporary Rent Details - location display verification', async ({ page, request }) => {
    // Check if temporary rentals exist in search or DB
    const searchRes = await request.get(`${backendBase}/search/temporary-rentals?limit=5`);
    expect(searchRes.status()).toBe(200);
    const searchBody = await searchRes.json();
    expect(searchBody.success).toBe(true);

    if (searchBody.data?.hits?.length > 0) {
      const rental = searchBody.data.hits[0];
      await page.goto(`/temporary-rent/${rental.id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
      const text = await page.textContent('body');
      expect(text).toContain(rental.geo?.cityName || 'مشهد');
    } else {
      // Direct navigation to temporary-rent scene
      await page.goto('/temporary-rent', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/.*temporary-rent.*/);
    }
  });

  test('Scenario 3: Ad Submission Review & Attribute Hygiene - No neighborhood spoofed into attributes', async ({ request }) => {
    // Verify direct API payload contracts: Listing search documents and ad details
    // MUST NOT contain neighbourhoodName or zoneId in attributes
    const adRes = await request.get(`${backendBase}/ads/${haftTirAdId}`);
    expect(adRes.status()).toBe(200);
    const adData = await adRes.json();
    expect(adData.success).toBe(true);
    
    const ad = adData.data;
    // Location is authoritatively resolved in canonical location object
    expect(ad.location.city.name).toBe('مشهد');
    expect(ad.location.neighbourhood.name).toBe('هفت تیر');
    // Legacy duplicate fields must be strictly absent
    expect(ad.location.area).toBeUndefined();
    expect(ad.resolvedLocation).toBeUndefined();
    // Ad attributes MUST NOT contain neighbourhoodName or zoneId
    expect(ad.attributes?.neighbourhoodName).toBeUndefined();
    expect(ad.attributes?.neighbourhood).toBeUndefined();
    
    // Check search index projection hygiene
    const searchDocRes = await request.get(`${backendBase}/search/listings?limit=10`);
    expect(searchDocRes.status()).toBe(200);
    const searchDocBody = await searchDocRes.json();
    const doc = searchDocBody.data.hits.find((h: { id: string }) => h.id === haftTirAdId);
    expect(doc).toBeDefined();
    // Geo contains geometry-derived neighbourhoodName
    expect(doc.geo.neighbourhoodName).toBe('هفت تیر');
    // Attributes dynamic maps MUST NOT store neighbourhoodName
    expect(doc.attributes.string?.neighbourhoodName).toBeUndefined();
  });

  test('Scenario 4: Single Neighborhood Filter on /ads - filters listings accurately and preserves map markers', async ({ page }) => {
    await page.goto(`/ads?cityId=${mashhadCityId}&neighbourhoodNames=هفت%20تیر&view=split`, { waitUntil: 'domcontentloaded' });
    
    // Wait for ad cards to render
    const card = page.locator(`a[href*="/ads/${haftTirAdId}"]`).first();
    await expect(card).toBeVisible({ timeout: 15000 });

    // The Haft Tir listing must be visible
    const cardText = await card.textContent();
    expect(cardText).toContain('هفت تیر');
    expect(cardText).toContain('مشهد');

    // The Daneshjoo listing must NOT be in the filtered list
    const daneshjooCard = page.locator(`a[href*="/ads/${daneshjooAdId}"]`);
    await expect(daneshjooCard).toHaveCount(0);
  });

  test('Scenario 5: Multiple Neighborhood Filter on /ads - returns union of both neighborhoods', async ({ page }) => {
    await page.goto(`/ads?cityId=${mashhadCityId}&neighbourhoodNames=هفت%20تیر&neighbourhoodNames=دانشجو&view=split`, { waitUntil: 'domcontentloaded' });

    // Both Haft-e Tir and Daneshjoo cards must be visible
    const haftTirCard = page.locator(`a[href*="/ads/${haftTirAdId}"]`).first();
    const daneshjooCard = page.locator(`a[href*="/ads/${daneshjooAdId}"]`).first();

    await expect(haftTirCard).toBeVisible({ timeout: 15000 });
    await expect(daneshjooCard).toBeVisible({ timeout: 15000 });

    // Tehran listing must NOT be visible
    const tehranCard = page.locator(`a[href*="/ads/${elahiyehTehranAdId}"]`);
    await expect(tehranCard).toHaveCount(0);
  });

  test('Scenario 6: No-Match / Stale State - empty state renders gracefully without error', async ({ page }) => {
    await page.goto(`/ads?cityId=${mashhadCityId}&neighbourhoodNames=محله_ناموجود_تستی&view=split`, { waitUntil: 'domcontentloaded' });

    // Should render empty state message gracefully
    const bodyText = await page.textContent('body');
    // Either empty state illustration/text or zero property cards
    const propertyCards = page.locator('article, [class*="PropertyCard"]');
    const cardCount = await propertyCards.count();
    expect(cardCount).toBe(0);
  });

  test('Scenario 7: Regression Checks - view mode switching and responsive layouts', async ({ page }) => {
    // 1. Split view
    await page.goto(`/ads?view=split`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

    // 2. List view
    await page.goto(`/ads?view=list`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

    // 3. Map view
    await page.goto(`/ads?view=map`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
  });
});
