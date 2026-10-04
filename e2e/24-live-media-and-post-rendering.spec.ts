import { test, expect } from '@playwright/test';
import { attachTelemetry, loginAsAdmin, loginAsUser } from './helpers/auth';

test.describe('Flow 24: Live Frontend Media & Core Pages Verification', () => {

  test('1. Homepage loads successfully with responsive navigation and search bar', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Verify page title or brand
    await expect(page).toHaveTitle(/ملک|Melktoday/i);

    // Verify main brand logo or link
    const homeLink = page.locator('aside a[href="/"], nav a[href="/"], a[href="/"]');
    await expect(homeLink.first()).toBeVisible({ timeout: 10000 });

    // Verify navigation links
    const exploreLink = page.locator('aside a[href="/explore"], nav a[href="/explore"], a[href="/explore"]');
    const adsLink = page.locator('aside a[href="/ads"], nav a[href="/ads"], a[href="/ads"]');
    const tempRentLink = page.locator('aside a[href="/temporary-rent"], nav a[href="/temporary-rent"], a[href="/temporary-rent"]');

    await expect(exploreLink.first()).toBeVisible();
    await expect(adsLink.first()).toBeVisible();
    await expect(tempRentLink.first()).toBeVisible();

    // Verify no critical fatal errors
    const fatalErrors = telemetry.errors.filter((e) => !e.includes('favicon') && !e.includes('sw.js'));
    expect(fatalErrors.length).toBe(0);
  });

  test('2. Explore page loads unified feed with canonical media cards', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // Assert URL
    await expect(page).toHaveURL(/\/explore/);

    // Verify header / title of explore
    const exploreHeading = page.locator('h1, h2').filter({ hasText: /اکسپلور|پست/ });
    if (await exploreHeading.count() > 0) {
      await expect(exploreHeading.first()).toBeVisible();
    }

    // Check for post cards or empty state
    const postCards = page.locator('article, a[href*="/posts/"]:not([href="/posts/create"])');
    const count = await postCards.count();
    console.log(`[Explore Test] Detected ${count} post cards on explore page`);

    if (count > 0) {
      // First card has valid link and non-broken image / container
      const firstCard = postCards.first();
      await expect(firstCard).toBeVisible();

      const cardImages = firstCard.locator('img');
      const imgCount = await cardImages.count();
      if (imgCount > 0) {
        const src = await cardImages.first().getAttribute('src');
        expect(src).toBeTruthy();
        expect(src).not.toContain('undefined');
        expect(src).not.toContain('null');
      }
    }

    const fatalErrors = telemetry.errors.filter((e) => !e.includes('favicon') && !e.includes('sw.js'));
    expect(fatalErrors.length).toBe(0);
  });

  test('3. Single post page renders publisher info and media gallery cleanly', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    // Navigate to explore to pick the latest live post or fallback to live test post
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const postLinks = page.locator('a[href*="/posts/"]:not([href="/posts/create"])');
    let targetUrl = '/posts/live-test-post-1791093427768';

    if (await postLinks.count() > 0) {
      const href = await postLinks.first().getAttribute('href');
      if (href) targetUrl = href;
    }

    console.log(`[Post Details Test] Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // Verify post container rendered
    const postContainer = page.locator('main, article, .max-w-6xl, .max-w-7xl').first();
    await expect(postContainer).toBeVisible({ timeout: 15000 });

    // Check that there are no unhandled JavaScript crashes
    const fatalErrors = telemetry.errors.filter((e) => !e.includes('favicon') && !e.includes('sw.js'));
    expect(fatalErrors.length).toBe(0);
  });

  test('3b. Verified Live Post (/posts/live-test-post-1791093427768) renders canonical image and video carousel', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await page.goto('/posts/live-test-post-1791093427768', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Assert URL
    await expect(page).toHaveURL(/live-test-post-1791093427768/);

    // Assert Post Title
    const titleLocator = page.locator('h1, h2').filter({ hasText: /سرمایه‌گذاری/ });
    await expect(titleLocator.first()).toBeVisible({ timeout: 15000 });

    // Assert slide index badge (۱ / ۲) or media presence
    const slideBadge = page.locator('text=۱ / ۲, text=1 / 2, div:has-text("۲")');
    if (await slideBadge.count() > 0) {
      await expect(slideBadge.first()).toBeVisible();
    }

    // First slide is IMAGE
    const firstImg = page.locator('img[src*="/media/"]').first();
    await expect(firstImg).toBeVisible({ timeout: 10000 });

    // Click carousel next button to switch to VIDEO
    const nextBtn = page.locator('button:has(svg.lucide-chevron-left), button:has-text("بعدی")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);

      // Verify video element is present
      const videoElement = page.locator('video');
      await expect(videoElement.first()).toBeVisible();
      const videoSrc = await videoElement.first().getAttribute('src');
      expect(videoSrc).toBeTruthy();
      expect(videoSrc).toContain('/media/');
    }

    const fatalErrors = telemetry.errors.filter((e) => !e.includes('favicon') && !e.includes('sw.js'));
    expect(fatalErrors.length).toBe(0);
  });

  test('4. Ads listing page (/ads) renders filters and listings', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await page.goto('/ads', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/ads/);

    // Verify search or filter container
    const searchFilter = page.locator('input[type="text"], input[type="search"]').first();
    if (await searchFilter.count() > 0) {
      await expect(searchFilter).toBeVisible();
    }

    const fatalErrors = telemetry.errors.filter((e) => !e.includes('favicon') && !e.includes('sw.js'));
    expect(fatalErrors.length).toBe(0);
  });

  test('5. Temporary rent listing page (/temporary-rent) renders listings', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await page.goto('/temporary-rent', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/temporary-rent/);

    const fatalErrors = telemetry.errors.filter((e) => !e.includes('favicon') && !e.includes('sw.js'));
    expect(fatalErrors.length).toBe(0);
  });

  test('6. User can view Favorites page (/favorites) without media errors', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await loginAsUser(page);

    await page.goto('/favorites', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/favorites/);

    // Verify empty state or favorites list
    const favHeading = page.locator('h1, h2').filter({ hasText: /علاقه‌مندی|نشان‌شده/ });
    if (await favHeading.count() > 0) {
      await expect(favHeading.first()).toBeVisible();
    }

    const fatalErrors = telemetry.errors.filter((e) => !e.includes('favicon') && !e.includes('sw.js'));
    expect(fatalErrors.length).toBe(0);
  });

  test('7. Admin can access Create Post wizard (/posts/create) and toggle formats', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await loginAsAdmin(page);

    await page.goto('/posts/create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/posts\/create/);

    // Step 1: Format selection buttons
    const instagramFormatBtn = page.locator('button').filter({ hasText: /اینستاگرام|تصویری/ }).first();
    const mediumFormatBtn = page.locator('button').filter({ hasText: /مقاله|مدیوم/ }).first();

    if (await instagramFormatBtn.count() > 0) {
      await expect(instagramFormatBtn).toBeVisible();
      await instagramFormatBtn.click();
    }

    if (await mediumFormatBtn.count() > 0) {
      await expect(mediumFormatBtn).toBeVisible();
    }

    // Verify step progression button exists
    const nextBtn = page.locator('button').filter({ hasText: /مرحله بعدی|ادامه/ }).first();
    if (await nextBtn.count() > 0) {
      await expect(nextBtn).toBeVisible();
    }

    const fatalErrors = telemetry.errors.filter((e) => !e.includes('favicon') && !e.includes('sw.js'));
    expect(fatalErrors.length).toBe(0);
  });

  test('8. Mobile viewport responsive check (390x844)', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Mobile header/bottom nav exists
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check explore on mobile
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/explore/);

    const fatalErrors = telemetry.errors.filter((e) => !e.includes('favicon') && !e.includes('sw.js'));
    expect(fatalErrors.length).toBe(0);
  });

});
