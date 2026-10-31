import { test, expect } from '@playwright/test';

const LIVE_API_BASE = 'https://melktoday.com/backend/api';

test.describe('1. Live Backend Search API - Filter Accuracy & Data Inspection', () => {
  const mashhadCityId = '4c01ce1e-d916-484e-87d5-3fcc14227741';
  // Actual live zone IDs in Mashhad
  const sarafrazanZoneId = '5b1bea78-ee21-4b38-a7ff-3650ae343153';
  const azadshahrZoneId = '9a2b7bda-333a-4875-b6e6-a76c3dea09c9';

  test('Category & Subcategory filtering: returns only matching listings', async ({ request }) => {
    const res = await request.get(`${LIVE_API_BASE}/search/listings`, {
      params: {
        categoryKey: 'residential_sale',
        subcategoryKey: 'apartment',
        limit: '20',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBeGreaterThan(0);
    expect(body.data.hits.length).toBeGreaterThan(0);

    for (const hit of body.data.hits) {
      expect(hit.taxonomy?.categoryId).toBe('residential_sale');
      expect(hit.taxonomy?.subcategoryId).toBe('apartment');
    }
  });

  test('Area range filtering: all hits strictly fall within minArea and maxArea', async ({ request }) => {
    const minArea = 100;
    const maxArea = 150;
    const res = await request.get(`${LIVE_API_BASE}/search/listings`, {
      params: {
        minArea: String(minArea),
        maxArea: String(maxArea),
        limit: '20',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBeGreaterThan(0);

    for (const hit of body.data.hits) {
      const area = hit.attributes?.area ?? hit.attributes?.number?.area;
      expect(area).toBeDefined();
      expect(Number(area)).toBeGreaterThanOrEqual(minArea);
      expect(Number(area)).toBeLessThanOrEqual(maxArea);
    }
  });

  test('Rooms count inspection: validates attribute storage and query.minRooms filtering', async ({ request }) => {
    // 1. Direct canonical attribute filtering directly on Meilisearch: returns 600+ listings
    const resValid = await request.get(`${LIVE_API_BASE}/search/listings`, {
      params: {
        numericAttributes: JSON.stringify({ rooms_count: { min: 2, max: 2 } }),
        limit: '20',
      },
    });
    expect(resValid.status()).toBe(200);
    const bodyValid = await resValid.json();
    expect(bodyValid.success).toBe(true);
    expect(bodyValid.data.total).toBeGreaterThan(0);
    for (const hit of bodyValid.data.hits) {
      expect(hit.attributes?.number?.rooms_count).toBe(2);
    }

    // 2. Query param minRooms and maxRooms filtering
    const resRooms = await request.get(`${LIVE_API_BASE}/search/listings`, {
      params: {
        minRooms: '2',
        maxRooms: '2',
        limit: '20',
      },
    });
    expect(resRooms.status()).toBe(200);
    const bodyRooms = await resRooms.json();
    expect(bodyRooms.success).toBe(true);
    expect(bodyRooms.data.total).toBeGreaterThan(0);
    for (const hit of bodyRooms.data.hits) {
      expect(hit.attributes?.number?.rooms_count).toBe(2);
    }
  });

  test('Amenities filtering: returns ads matching parking and elevator criteria', async ({ request }) => {
    const res = await request.get(`${LIVE_API_BASE}/search/listings`, {
      params: {
        hasParking: 'true',
        hasElevator: 'true',
        limit: '20',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBeGreaterThan(0);

    for (const hit of body.data.hits) {
      const parking = hit.attributes?.boolean?.has_parking ?? hit.attributes?.has_parking ?? hit.attributes?.parking;
      const elevator = hit.attributes?.boolean?.has_elevator ?? hit.attributes?.has_elevator ?? hit.attributes?.elevator;
      expect(Boolean(parking)).toBe(true);
      expect(Boolean(elevator)).toBe(true);
    }
  });

  test('Price sorting: ascending sort returns non-decreasing prices', async ({ request }) => {
    const res = await request.get(`${LIVE_API_BASE}/search/listings`, {
      params: {
        categoryKey: 'residential_sale',
        sort: 'price_asc',
        limit: '20',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.hits.length).toBeGreaterThan(1);

    const prices: number[] = body.data.hits.map((h: any) => {
      const p = h.pricing?.totalPrice ?? h.pricing?.price ?? h.pricing?.number?.totalPrice ?? h.pricing?.number?.price ?? 0;
      return Number(p);
    });

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('Price sorting: descending sort returns non-increasing prices', async ({ request }) => {
    const res = await request.get(`${LIVE_API_BASE}/search/listings`, {
      params: {
        categoryKey: 'residential_sale',
        sort: 'price_desc',
        limit: '20',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.hits.length).toBeGreaterThan(1);

    const prices: number[] = body.data.hits.map((h: any) => {
      const p = h.pricing?.totalPrice ?? h.pricing?.price ?? h.pricing?.number?.totalPrice ?? h.pricing?.number?.price ?? 0;
      return Number(p);
    });

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  test('Multi-zone filtering: restricts results to specified zone IDs', async ({ request }) => {
    const res = await request.get(`${LIVE_API_BASE}/search/listings`, {
      params: {
        cityId: mashhadCityId,
        zoneIds: `${sarafrazanZoneId},${azadshahrZoneId}`,
        limit: '20',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBe(53);
    for (const hit of body.data.hits) {
      const hitZones = hit.geo?.zoneIds || [];
      const matches = hitZones.includes(sarafrazanZoneId) || hitZones.includes(azadshahrZoneId);
      expect(matches).toBe(true);
    }
  });

  test('Map search: clusters and markers respect viewport and filters', async ({ request }) => {
    const res = await request.get(`${LIVE_API_BASE}/search/map`, {
      params: {
        cityId: mashhadCityId,
        northLat: '36.45',
        southLat: '36.20',
        eastLng: '59.65',
        westLng: '59.40',
        zoom: '12',
        minArea: '80',
        maxArea: '150',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.meta).toBeDefined();
    expect(body.data.meta.totalMatching).toBeGreaterThan(0);
    expect(Array.isArray(body.data.clusters)).toBe(true);
    expect(Array.isArray(body.data.markers)).toBe(true);
  });
});

test.describe('2. Frontend Query Parameter Synchronization & View State Persistence', () => {
  const mashhadCityId = '4c01ce1e-d916-484e-87d5-3fcc14227741';

  test('Deep-linked URL query parameters render correct filter chips and persist in URL', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const targetUrl = `/ads?cityId=${mashhadCityId}&cityName=%D9%85%D8%B4%D9%87%D8%AF&categoryKey=residential_sale&subcategoryKey=apartment&minArea=100&maxArea=150&view=list`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Verify URL parameters remain completely intact
    const currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get('cityId')).toBe(mashhadCityId);
    expect(currentUrl.searchParams.get('categoryKey')).toBe('residential_sale');
    expect(currentUrl.searchParams.get('subcategoryKey')).toBe('apartment');
    expect(currentUrl.searchParams.get('minArea')).toBe('100');
    expect(currentUrl.searchParams.get('maxArea')).toBe('150');
    expect(currentUrl.searchParams.get('view')).toBe('list');

    // Verify active filter chips render on the page
    const filterChips = page.locator('[data-testid="active-filter-chips"]');
    await expect(filterChips).toBeVisible({ timeout: 10000 });
    await expect(filterChips).toContainText('متراژ:');
  });

  test('Switching view mode to map updates URL and survives page refresh without losing filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const targetUrl = `/ads?cityId=${mashhadCityId}&cityName=%D9%85%D8%B4%D9%87%D8%AF&categoryKey=residential_sale&subcategoryKey=apartment&minArea=100&maxArea=150&view=list`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Switch to Map View by clicking map button
    const mapButton = page.locator('button[title="نمایش تمام‌صفحه نقشه"], button:has-text("نقشه")').first();
    await expect(mapButton).toBeVisible();
    await mapButton.click();

    // Verify view mode parameter updated to map while preserving all other params
    await page.waitForURL((url) => url.searchParams.get('view') === 'map', { timeout: 10000 });
    let currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get('view')).toBe('map');
    expect(currentUrl.searchParams.get('cityId')).toBe(mashhadCityId);
    expect(currentUrl.searchParams.get('categoryKey')).toBe('residential_sale');
    expect(currentUrl.searchParams.get('subcategoryKey')).toBe('apartment');
    expect(currentUrl.searchParams.get('minArea')).toBe('100');
    expect(currentUrl.searchParams.get('maxArea')).toBe('150');

    // RELOAD page while in map mode
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify query parameters are still fully preserved after reload
    currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get('view')).toBe('map');
    expect(currentUrl.searchParams.get('cityId')).toBe(mashhadCityId);
    expect(currentUrl.searchParams.get('categoryKey')).toBe('residential_sale');
    expect(currentUrl.searchParams.get('subcategoryKey')).toBe('apartment');
    expect(currentUrl.searchParams.get('minArea')).toBe('100');
    expect(currentUrl.searchParams.get('maxArea')).toBe('150');
  });

  test('Switching back from map to list updates view param and retains filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const targetUrl = `/ads?cityId=${mashhadCityId}&cityName=%D9%85%D8%B4%D9%87%D8%AF&categoryKey=residential_sale&minRooms=2&view=map`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Click list button
    const listButton = page.locator('button[title="نمایش فهرست"], button:has-text("فهرست")').first();
    await expect(listButton).toBeVisible();
    await listButton.click();

    // Verify URL updated to view=list and preserved minRooms
    await page.waitForURL((url) => url.searchParams.get('view') === 'list', { timeout: 10000 });
    const currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get('view')).toBe('list');
    expect(currentUrl.searchParams.get('minRooms')).toBe('2');
    expect(currentUrl.searchParams.get('cityId')).toBe(mashhadCityId);
  });

  test('Sort change updates URL query param and survives page refresh', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const targetUrl = `/ads?cityId=${mashhadCityId}&cityName=%D9%85%D8%B4%D9%87%D8%AF&categoryKey=residential_sale`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Select sort option "price_asc"
    const sortSelect = page.locator('select[aria-label="مرتب‌سازی"]');
    await expect(sortSelect).toBeAttached();
    await sortSelect.selectOption('price_asc');

    // Verify URL now has sort=price_asc
    await page.waitForURL((url) => url.searchParams.get('sort') === 'price_asc', { timeout: 10000 });
    let currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get('sort')).toBe('price_asc');
    expect(currentUrl.searchParams.get('categoryKey')).toBe('residential_sale');

    // RELOAD page and verify sort stays price_asc
    await page.reload({ waitUntil: 'domcontentloaded' });
    currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get('sort')).toBe('price_asc');
    expect(currentUrl.searchParams.get('categoryKey')).toBe('residential_sale');
  });

  test('Search input debounce synchronizes search param to URL and survives page refresh', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const targetUrl = `/ads?cityId=${mashhadCityId}&cityName=%D9%85%D8%B4%D9%87%D8%AF`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Locate search input
    const searchInput = page.locator('input[placeholder*="نام منطقه"], input[placeholder*="جستجو"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('آپارتمان');

    // Wait for debounced search to update URL
    await page.waitForURL((url) => url.searchParams.has('search'), { timeout: 10000 });
    let currentUrl = new URL(page.url());
    expect(decodeURIComponent(currentUrl.searchParams.get('search') || '')).toBe('آپارتمان');

    // RELOAD page and verify search param persists and input retains the value
    await page.reload({ waitUntil: 'domcontentloaded' });
    currentUrl = new URL(page.url());
    expect(decodeURIComponent(currentUrl.searchParams.get('search') || '')).toBe('آپارتمان');

    await expect(searchInput).toHaveValue('آپارتمان');
  });

  test('Removing an active filter chip removes it from URL query params while preserving others', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const targetUrl = `/ads?cityId=${mashhadCityId}&cityName=%D9%85%D8%B4%D9%87%D8%AF&categoryKey=residential_sale&minArea=100&maxArea=150&hasParking=true`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    const filterChips = page.locator('[data-testid="active-filter-chips"]');
    await expect(filterChips).toBeVisible({ timeout: 10000 });

    // Find the chip with text "متراژ:" and click its close button
    const areaChip = filterChips.locator('span:has-text("متراژ:")');
    await expect(areaChip).toBeVisible();
    const closeBtn = areaChip.locator('button');
    await closeBtn.click();

    // Verify minArea and maxArea are removed from URL, but hasParking and categoryKey remain
    await page.waitForURL((url) => !url.searchParams.has('minArea'), { timeout: 10000 });
    const currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.has('minArea')).toBe(false);
    expect(currentUrl.searchParams.has('maxArea')).toBe(false);
    expect(currentUrl.searchParams.get('hasParking')).toBe('true');
    expect(currentUrl.searchParams.get('categoryKey')).toBe('residential_sale');
  });

  test('SubcategoryFilterDrawer: opening modal, changing filters and applying updates URL query params and triggers refetch', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const targetUrl = `/ads?cityId=${mashhadCityId}&cityName=%D9%85%D8%B4%D9%87%D8%AF&categoryKey=residential_sale&subcategoryKey=apartment`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Open SubcategoryFilterDrawer by clicking "فیلترها"
    const filterBtn = page.locator('[data-testid="subcategory-filters-trigger"]').first();
    await expect(filterBtn).toBeVisible({ timeout: 10000 });
    await filterBtn.click();

    // Verify modal is open
    const modal = page.locator('[role="dialog"][data-modal="true"]');
    await expect(modal).toBeVisible();

    // Select "۲ خواب"
    const twoRoomsBtn = modal.locator('button:has-text("۲ خواب")').first();
    await expect(twoRoomsBtn).toBeVisible();
    await twoRoomsBtn.click();

    // Select "پارکینگ"
    const parkingBtn = modal.locator('button:has-text("پارکینگ")').first();
    await expect(parkingBtn).toBeVisible();
    await parkingBtn.click();

    // Setup network listener for search listings request
    const searchRequestPromise = page.waitForRequest((req) => 
      req.url().includes('/backend/api/search/listings') && 
      (req.url().includes('minRooms=2') || req.url().includes('hasParking=true')),
      { timeout: 10000 }
    ).catch(() => null);

    // Click "اعمال فیلترها"
    const applyBtn = modal.locator('button:has-text("اعمال فیلترها")').first();
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // Check URL after click
    await page.waitForURL((url) => url.searchParams.get('minRooms') === '2', { timeout: 10000 });

    const currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get('minRooms')).toBe('2');
    expect(currentUrl.searchParams.get('hasParking')).toBe('true');

    // Verify refetch network request was dispatched with the updated query parameters
    const searchRequest = await searchRequestPromise;
    expect(searchRequest).not.toBeNull();
  });
});
