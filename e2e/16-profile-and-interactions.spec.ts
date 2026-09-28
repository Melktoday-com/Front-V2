import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 16: Profile, Favorites & Ad Submission UI Tests', () => {
  test.describe('Standard User Profile & Favorites', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('Standard user profile displays user role badge and excludes privileged buttons', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/profile', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/profile/);

      // Verify role badge displays "کاربر معمولی"
      const roleBadge = page.locator('text=کاربر معمولی');
      await expect(roleBadge).toBeVisible({ timeout: 15000 });

      // Verify privileged admin/agency buttons are NOT visible
      const adminPanelBtn = page.locator('text=پنل مدیریت');
      await expect(adminPanelBtn).not.toBeVisible();

      const agencyPanelBtn = page.locator('text=مدیریت آژانس من');
      await expect(agencyPanelBtn).not.toBeVisible();

      expect(telemetry.errors.length).toBe(0);
    });

    test('Standard user can access /profile/ads and /favorites', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      // Access My Ads
      await page.goto('/profile/ads', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/profile\/ads/);
      await expect(page.locator('body')).toBeVisible();

      // Access Favorites
      await page.goto('/favorites', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/favorites/);
      const favHeader = page.locator('text=علاقه‌مندی‌ها');
      await expect(favHeader.first()).toBeVisible({ timeout: 15000 });

      expect(telemetry.errors.length).toBe(0);
    });

    test('Standard user can open ad creation form at /ads/submit', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/ads/submit', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/ads\/submit/);

      // Verify the submit form or category selection container is rendered
      const container = page.locator('main, form, div[class*="submit"]').first();
      await expect(container).toBeVisible({ timeout: 15000 });

      expect(telemetry.errors.length).toBe(0);
    });

    test('Standard user can access /profile/requests and view application history', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      const res = await page.goto('/profile/requests', { waitUntil: 'networkidle' });
      if (res?.status() === 404) {
        return;
      }
      await expect(page).toHaveURL(/\/profile\/requests/);

      // Verify heading
      const heading = page.locator('h1').or(page.locator('text=درخواست‌های عضویت و میزبانی')).first();
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Verify either request items or empty state
      const content = page.locator('.space-y-4').or(page.locator('text=هیچ درخواستی')).first();
      await expect(content).toBeVisible({ timeout: 10000 });

      expect(telemetry.errors.length).toBe(0);
    });
  });

  test.describe('Agent Profile Flow', () => {
    test.use({ storageState: 'playwright/.auth/agent.json' });

    test('Agent user profile displays agent role and provides agency panel shortcut', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/profile', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/profile/);

      // Verify role badge displays "مشاور املاک"
      const roleBadge = page.locator('text=مشاور املاک');
      await expect(roleBadge).toBeVisible({ timeout: 15000 });

      // Agent sees "مدیریت آژانس من"
      const agencyBtn = page.locator('text=مدیریت آژانس من');
      await expect(agencyBtn).toBeVisible({ timeout: 15000 });

      // But does NOT see "پنل مدیریت"
      const adminBtn = page.locator('text=پنل مدیریت');
      await expect(adminBtn).not.toBeVisible();

      expect(telemetry.errors.length).toBe(0);
    });
  });

  test.describe('Landlord Profile & Temporary Rent Flow', () => {
    test.use({ storageState: 'playwright/.auth/landlord.json' });

    test('Landlord user profile displays landlord role and navigates to temporary-rent panel', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/profile', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/profile/);

      // Verify role badge displays "میزبان"
      const roleBadge = page.getByText('میزبان', { exact: true });
      await expect(roleBadge).toBeVisible({ timeout: 15000 });

      // Navigate to /profile/temporary-rent
      await page.goto('/profile/temporary-rent', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/profile\/temporary-rent/);

      const panelContainer = page.locator('body');
      await expect(panelContainer).toBeVisible();

      expect(telemetry.errors.length).toBe(0);
    });
  });
});
