import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 9: Promotions & Campaigns Review UI Test', () => {
  test.use({ storageState: 'playwright/.auth/superadmin.json' });

  test('Admin navigates to /admin/promotions and verifies promotions queue and actions', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/promotions', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/promotions/);

    // Header validation
    const heading = page.locator('h1');
    await expect(heading).toContainText('بررسی درخواست‌های ارتقا');

    // Table container
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    // Rows
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Admin navigates to /admin/campaigns and verifies campaigns queue', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/campaigns', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/campaigns/);

    // Header validation
    const heading = page.locator('h1');
    await expect(heading).toContainText('بررسی کمپین‌های تبلیغاتی');

    // Table container
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });
  });
});
