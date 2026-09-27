import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 11: Host Applications Moderation UI Test', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Admin navigates to /admin/hosts and verifies host application review interface', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/hosts', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/hosts/);

    // Verify page header
    const heading = page.locator('h1');
    await expect(heading).toContainText('مدیریت درخواست‌های میزبانی اقامتگاه', { timeout: 15000 });

    // Verify refresh button exists
    const refreshBtn = page.locator('button:has-text("به‌روزرسانی")');
    await expect(refreshBtn).toBeVisible({ timeout: 10000 });

    // Search input should be available
    const searchInput = page.locator('input[placeholder*="جستجو"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      await searchInput.first().fill('اقامتگاه');
      await page.waitForTimeout(500);
      await searchInput.first().clear();
    }

    // Telemetry check
    expect(telemetry.errors.length).toBe(0);
  });
});
