import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Admin Platform Management (/admin/platform)', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('loads platform profile and submits PUT /platform/admin/profile without disallowed fields', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/platform', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/platform/);
    await expect(page.locator('h1')).toContainText('مدیریت صفحه رسمی پلتفرم');

    const titleInput = page.locator('form input[type="text"]').first();
    await expect(titleInput).toBeVisible({ timeout: 15000 });

    const reqPromise = page.waitForRequest(
      (req) => req.url().includes('/platform/admin/profile') && req.method() === 'PUT',
      { timeout: 15000 },
    );
    const resPromise = page.waitForResponse(
      (res) => res.url().includes('/platform/admin/profile') && res.request().method() === 'PUT',
      { timeout: 15000 },
    );

    await page.locator('button[type="submit"]').click();

    const req = await reqPromise;
    const payload = JSON.parse(req.postData() || '{}') as Record<string, unknown>;
    expect(payload).not.toHaveProperty('avatarUrl');
    expect(payload).toHaveProperty('title');

    const res = await resPromise;
    expect(res.status()).toBe(200);

    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 10000 });
    expect(telemetry.errors).toEqual([]);
  });
});
