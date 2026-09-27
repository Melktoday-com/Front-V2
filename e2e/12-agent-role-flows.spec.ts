import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 12: Agent Role Platform UI Flows', () => {
  test.use({ storageState: 'playwright/.auth/agent.json' });

  test('Agent user is blocked from /admin panel by RBAC guard', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Agent should not have access to admin panel
    expect(page.url()).not.toContain('/admin/dashboard');
    const adminLayoutVisible = await page.locator('.admin-layout').isVisible();
    expect(adminLayoutVisible).toBe(false);

    expect(telemetry.errors.length).toBe(0);
  });

  test('Agent user can access /agency directory and property showcase', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/agency', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Should load /agency page
    expect(page.url()).toContain('/agency');

    // Telemetry check
    expect(telemetry.errors.length).toBe(0);
  });

  test('Agent user can view personal wallet balance at /wallet', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/wallet', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/wallet/);

    // Wallet balance and top-up button should be visible
    const topUpButton = page.locator('button:has-text("افزایش موجودی")');
    await expect(topUpButton).toBeVisible({ timeout: 15000 });

    expect(telemetry.errors.length).toBe(0);
  });

  test('Agent user can browse public real estate listings at /ads', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/ads', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/ads/);

    const cards = page.locator('a[href^="/ads/"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    expect(telemetry.errors.length).toBe(0);
  });
});
