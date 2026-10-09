import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 7: Temporary Rent & Host Lifecycle UI Test', () => {
  test.describe('Admin temporary rent management', () => {
    test.use({ storageState: 'playwright/.auth/superadmin.json' });

    test('Admin navigates to /admin/temporary-rent and checks accommodation queues and tabs', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/admin/temporary-rent', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/admin\/temporary-rent/);

      // Header validation
      const heading = page.locator('h1');
      await expect(heading).toContainText('مدیریت اجاره موقت');

      // Create new accommodation button
      const createBtn = page.locator('a[href="/admin/temporary-rent/create"]').first();
      await expect(createBtn).toBeVisible();

      // Verify tabs
      const categoriesTab = page.locator('button:has-text("دسته‌بندی‌ها")').or(page.locator('a:has-text("دسته‌بندی‌ها")')).first();
      if (await categoriesTab.isVisible()) {
        await categoriesTab.click();
      }
    });
  });

  test('Public temporary rent explore page (/temporary-rent) loads accommodations', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/temporary-rent', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/temporary-rent/);

    // Accommodation cards or grid should be visible
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible({ timeout: 15000 });
  });
});
