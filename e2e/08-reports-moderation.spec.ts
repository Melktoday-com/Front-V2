import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 8: Content Moderation & Reports UI Test', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Admin navigates to /admin/reports and checks reports table and 1-click moderation', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/reports', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/reports/);

    // Header validation
    const heading = page.locator('h1');
    await expect(heading).toContainText('گزارش‌های تخلف');

    // Table or empty state container
    const tableContainer = page.locator('.overflow-hidden').first();
    await expect(tableContainer).toBeVisible({ timeout: 15000 });

    // Check if there is a pending report with action buttons
    const resolveBtn = page.locator('button[title="حل شده / جریمه"]').first();
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();

      // Verify Sonner toast
      const toast = page.locator('[data-sonner-toast]');
      await expect(toast).toBeVisible({ timeout: 10000 });
    }
  });
});
