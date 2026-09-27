import { test, expect } from '@playwright/test';
import { attachTelemetry, loginAsAdmin, loginAsUser, ADMIN_PHONE, USER_PHONE } from './helpers/auth';

test.describe('Flow 1: Authentication & RBAC UI Test', () => {
  test('Guest is redirected to /auth when accessing /admin directly', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await page.goto('/admin', { waitUntil: 'networkidle' });
    
    // AccessGuard should redirect to /auth?redirect=/admin
    await expect(page).toHaveURL(/\/auth/);
    const hasPhoneInput = await page.locator('input[type="tel"]').isVisible();
    expect(hasPhoneInput).toBe(true);

    // No uncaught page errors
    expect(telemetry.errors.length).toBe(0);
  });

  test('Standard user can login via UI and is blocked from /admin', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await loginAsUser(page);

    // Verify cookies set
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((c) => c.name === 'access_token');
    expect(tokenCookie).toBeDefined();

    // Standard user tries to access /admin
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Should be redirected away to /
    expect(page.url()).not.toContain('/admin');
    const adminLayoutVisible = await page.locator('.admin-layout').isVisible();
    expect(adminLayoutVisible).toBe(false);
  });

  test('Admin user can login via UI and access /admin dashboard', async ({ page }) => {
    const telemetry = attachTelemetry(page);
    await loginAsAdmin(page);

    // Navigate to /admin
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin/);

    // Admin layout should be visible
    const adminLayout = page.locator('.admin-layout');
    await expect(adminLayout).toBeVisible({ timeout: 10000 });

    // Header title should be Dashboard
    const headerTitle = page.locator('header h2');
    await expect(headerTitle).toContainText('داشبورد');

    // Sidebar navigation items should be visible
    const usersLink = page.locator('aside nav a[href="/admin/users"]');
    await expect(usersLink).toBeVisible();

    const adsLink = page.locator('aside nav a[href="/admin/ads"]');
    await expect(adsLink).toBeVisible();

    const walletLink = page.locator('aside nav a[href="/admin/wallet"]');
    await expect(walletLink).toBeVisible();
  });
});
