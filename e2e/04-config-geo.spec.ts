import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 4: Platform Config & Geo Zones UI Test', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Admin navigates to /admin/config and views platform configuration tabs', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/config', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/config/);

    // Header validation
    const heading = page.locator('h1');
    await expect(heading).toContainText('تنظیمات');

    // Verify main dynamic configuration tabs
    const plansTab = page.locator('button:has-text("پلن‌های اشتراک")').first();
    await expect(plansTab).toBeVisible({ timeout: 10000 });

    const tariffsTab = page.locator('button:has-text("تعرفه‌های ۶گانه سیستم")').first();
    await expect(tariffsTab).toBeVisible({ timeout: 10000 });
    await tariffsTab.click();

    // Verify tariffs tab content rendered
    await expect(page.locator('text=Platform Monetary Tariffs').first()).toBeVisible({ timeout: 10000 });
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
