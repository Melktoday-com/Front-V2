import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 13: Landlord Role Platform UI Flows', () => {
  test.use({ storageState: 'playwright/.auth/landlord.json' });

  test('Landlord user (User 4) is blocked from /admin panel by RBAC guard', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Landlord should not have access to admin panel
    expect(page.url()).not.toContain('/admin/dashboard');
    const adminLayoutVisible = await page.locator('.admin-layout').isVisible();
    expect(adminLayoutVisible).toBe(false);

    expect(telemetry.errors.length).toBe(0);
  });

  test('Landlord user can access temporary rent listings at /temporary-rent', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/temporary-rent', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/temporary-rent/);

    // Header or search component should be rendered
    const title = page.locator('h1');
    await expect(title).toBeVisible({ timeout: 15000 });

    expect(telemetry.errors.length).toBe(0);
  });

  test('Landlord user can view personal wallet balance at /wallet', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/wallet', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/wallet/);

    // Top-up button should be visible
    const topUpButton = page.locator('button:has-text("افزایش موجودی")');
    await expect(topUpButton).toBeVisible({ timeout: 15000 });

    expect(telemetry.errors.length).toBe(0);
  });
});
