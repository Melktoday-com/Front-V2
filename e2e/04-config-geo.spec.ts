import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 4: Platform Config & Geo Zones UI Test', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Admin navigates to /admin/config and updates plan limits', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/config', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/config/);

    // Header validation
    const heading = page.locator('h1');
    await expect(heading).toContainText('تنظیمات');

    // Plan selector tabs (FREE / PRO)
    const proTab = page.locator('button:has-text("PRO")').or(page.locator('button:has-text("حرفه‌ای")')).first();
    if (await proTab.isVisible()) {
      await proTab.click();
    }

    // Save button
    const saveBtn = page.locator('button:has-text("ذخیره")').first();
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify toast notification appears
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible({ timeout: 10000 });
  });

  test('Admin navigates to /admin/geo and views zones list and tabs', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/geo', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/geo/);

    // Header validation
    const heading = page.locator('h1').or(page.locator('text=مناطق جغرافیایی')).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Table or list should be rendered
    const content = page.locator('table').or(page.locator('.divide-y')).first();
    await expect(content).toBeVisible({ timeout: 15000 });

    // Search input should be present
    const searchInput = page.locator('input[placeholder*="جستجو"]').first();
    await expect(searchInput).toBeVisible();
  });
});
