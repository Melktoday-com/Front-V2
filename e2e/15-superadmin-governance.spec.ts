import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 15: SuperAdmin Governance & System Configuration UI Test', () => {
  test.use({ storageState: 'playwright/.auth/superadmin.json' });

  test('SuperAdmin accesses /admin/config and manages subscription plan limits', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/config', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/config/);

    // Header validation
    const heading = page.locator('h1').or(page.locator('header h2')).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Plan selector tabs (FREE / PRO)
    const proTab = page.locator('button:has-text("PRO")').or(page.locator('button:has-text("حرفه‌ای")')).first();
    if (await proTab.isVisible()) {
      await proTab.click();
    }

    // Save button
    const saveBtn = page.locator('button:has-text("ذخیره")').first();
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await saveBtn.click();

    // Verify toast notification appears
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible({ timeout: 10000 });

    console.log('TELEMETRY ERRORS:', telemetry.errors); expect(telemetry.errors.length).toBeLessThanOrEqual(1);
  });

  test('SuperAdmin accesses /admin/geo and verifies geographic zones table', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/geo', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/geo/);

    const heading = page.locator('h1').or(page.locator('text=مناطق جغرافیایی')).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Search bar should be available
    const searchInput = page.locator('input[placeholder*="جستجو"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    expect(telemetry.errors.length).toBe(0);
  });

  test('SuperAdmin accesses /admin/archive and verifies recycling bin tabs', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/archive', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/archive/);

    const heading = page.locator('h1').or(page.locator('text=سطل زباله')).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    const categoriesTab = page.locator('button:has-text("دسته‌بندی‌های اصلی")').or(page.locator('button:has-text("دسته‌بندی‌ها")')).first();
    await expect(categoriesTab).toBeVisible({ timeout: 10000 });

    const subcategoriesTab = page.locator('button:has-text("زیر‌دسته‌ها")').or(page.locator('button:has-text("زیردسته‌ها")')).first();
    if (await subcategoriesTab.isVisible()) {
      await subcategoriesTab.click();
    }

    expect(telemetry.errors.length).toBe(0);
  });
});
