import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 10: Agency & Consultant Applications Moderation UI Test', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Admin navigates to /admin/agencies and verifies application queues and tabs', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/agencies', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/agencies/);

    // Verify page header
    const heading = page.locator('h1');
    await expect(heading).toContainText('مدیریت دفاتر املاک و مشاوران', { timeout: 15000 });

    // Verify navigation tabs
    const applicationsTab = page.locator('button:has-text("درخواست‌های عضویت")');
    const agenciesTab = page.locator('button:has-text("املاک و مشاوران ثبت‌شده")');
    await expect(applicationsTab).toBeVisible({ timeout: 10000 });
    await expect(agenciesTab).toBeVisible({ timeout: 10000 });

    // Switch to registered agencies tab
    await agenciesTab.click();
    await page.waitForTimeout(1000);

    // Switch back to applications tab
    await applicationsTab.click();
    await page.waitForTimeout(1000);

    // Filter buttons should exist
    const pendingFilter = page.locator('button:has-text("در انتظار بررسی")').or(page.locator('button:has-text("PENDING")'));
    if (await pendingFilter.count() > 0) {
      await expect(pendingFilter.first()).toBeVisible();
    }

    // Telemetry check
    expect(telemetry.errors.length).toBe(0);
  });

  test('Public user can explore agency directory at /agency', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/agency', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Page URL should be /agency
    expect(page.url()).toContain('/agency');

    // No fatal uncaught page errors
    expect(telemetry.errors.length).toBe(0);
  });
});
