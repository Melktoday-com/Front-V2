import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 14: System Notifications & Broadcast UI Test', () => {
  test.describe('Admin Broadcast Notifications', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Admin navigates to /admin/notifications and inspects broadcast form', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/admin/notifications', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/admin\/notifications/);

      // Verify page title
      const title = page.locator('h1');
      await expect(title).toContainText('ارسال اطلاعیه همگانی', { timeout: 15000 });

      // Verify input fields
      const titleInput = page.locator('input[placeholder*="به‌روزرسانی"]');
      const bodyTextarea = page.locator('textarea[placeholder*="پیام"]');
      await expect(titleInput).toBeVisible({ timeout: 10000 });
      await expect(bodyTextarea).toBeVisible({ timeout: 10000 });

      // Audience buttons should be visible
      const audienceBtn = page.locator('button:has-text("همه کاربران")');
      await expect(audienceBtn).toBeVisible({ timeout: 10000 });

      // Submit button should be visible
      const submitBtn = page.locator('button[type="submit"]');
      await expect(submitBtn).toBeVisible({ timeout: 10000 });

      expect(telemetry.errors.length).toBe(0);
    });
  });

  test.describe('User Notification Center', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('User navigates to /notifications and inspects notifications center', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/notifications', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/notifications/);

      // Verify header or notifications container
      const container = page.locator('main').first();
      await expect(container).toBeVisible({ timeout: 15000 });

      expect(telemetry.errors.length).toBe(0);
    });
  });
});
