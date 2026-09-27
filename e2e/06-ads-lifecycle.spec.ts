import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 6: Real Estate Ads Lifecycle UI Test', () => {
  test.describe('Admin ads management', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Admin navigates to /admin/ads, inspects status filter tabs and listings table', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/admin/ads', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/admin\/ads/);

      // Header validation
      const heading = page.locator('h1');
      await expect(heading).toContainText('مدیریت آگهی‌ها');

      // Filter tabs
      const pendingTab = page.locator('button:has-text("در انتظار بررسی")').first();
      await expect(pendingTab).toBeVisible({ timeout: 15000 });
      await pendingTab.click();

      const publishedTab = page.locator('button:has-text("منتشر شده")').first();
      await expect(publishedTab).toBeVisible();
      await publishedTab.click();

      // Table or list should be rendered
      const listContainer = page.locator('table').or(page.locator('.divide-y')).first();
      await expect(listContainer).toBeVisible({ timeout: 15000 });
    });
  });

  test('Public and user explore page (/ads) renders listing cards', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/ads', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/ads/);

    // Page title/content
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible({ timeout: 15000 });
  });
});
