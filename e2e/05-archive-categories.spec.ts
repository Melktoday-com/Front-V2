import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 5: Categories & Recycle Bin UI Test', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Admin navigates to /admin/archive and checks recycle bin tabs', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/archive', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/archive/);

    // Header validation
    const heading = page.locator('h1').or(page.locator('text=سطل زباله')).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Category / Subcategory tabs
    const catTab = page.locator('button:has-text("دسته‌بندی‌های اصلی")').or(page.locator('button:has-text("دسته‌بندی‌ها")')).first();
    await expect(catTab).toBeVisible();

    const subCatTab = page.locator('button:has-text("زیر‌دسته‌ها")').or(page.locator('button:has-text("زیردسته‌ها")')).first();
    if (await subCatTab.isVisible()) {
      await subCatTab.click();
    }
  });

  test('Admin navigates to /admin/ads?tab=categories to inspect category hierarchy', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/ads?tab=categories', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/ads\?tab=categories/);

    // Categories container rendered
    const container = page.locator('.space-y-6').or(page.locator('.divide-y')).first();
    await expect(container).toBeVisible({ timeout: 15000 });
  });
});
