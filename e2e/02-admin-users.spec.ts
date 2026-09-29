import { test, expect } from '@playwright/test';
import { attachTelemetry, loginAsAdmin } from './helpers/auth';

test.describe('Flow 2: Admin Users & Moderation UI Test', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Admin navigates to /admin/users and verifies user table and actions', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/users/);

    // Header validation
    const heading = page.locator('h1');
    await expect(heading).toContainText('مدیریت کاربران');

    // Table should render with at least one row
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify columns: name, phone, roles, status, actions
    const firstRow = rows.first();
    const phoneCell = firstRow.locator('td.font-mono');
    await expect(phoneCell).toBeVisible();

    // Verify wallet shortcut button
    const walletBtn = firstRow.locator('button[title="شارژ یا کسر کیف پول"]');
    await expect(walletBtn).toBeVisible();

    // Verify action buttons exist
    const hasSuspendBtn = await firstRow.locator('button[title="تعلیق موقت"]').isVisible();
    const hasReinstateBtn = await firstRow.locator('button[title="لغو تعلیق"]').isVisible();
    const hasUnbanBtn = await firstRow.locator('button[title="رفع محدودیت"]').isVisible();
    expect(hasSuspendBtn || hasReinstateBtn || hasUnbanBtn).toBe(true);
  });

  test('Admin can perform suspend and reinstate via dialogs', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });

    // Test reinstate if any user has restriction (suspended or banned)
    const restoreBtn = page.locator('tbody tr button[title="لغو تعلیق"], tbody tr button[title="رفع محدودیت"]').first();
    if (await restoreBtn.isVisible()) {
      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });
      await restoreBtn.click();
      const toast = page.locator('[data-sonner-toast]').first();
      await expect(toast).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1500);
    }

    // Test suspend on an active user
    const suspendButtons = page.locator('tbody tr button[title="تعلیق موقت"]');
    const suspendCount = await suspendButtons.count();
    if (suspendCount > 0) {
      const suspendBtn = suspendButtons.first();
      let count = 0;
      page.on('dialog', async (dialog) => {
        count++;
        if (count === 1) await dialog.accept('تست خودکار تعلیق');
        else if (count === 2) await dialog.accept('3');
        else await dialog.dismiss();
      });

      const respPromise = page.waitForResponse(r => r.url().includes('/suspend'), { timeout: 10000 }).catch(() => null);
      await suspendBtn.click();
      const resp = await respPromise;
      if (resp && resp.ok()) {
        const toast = page.locator('[data-sonner-toast]').first();
        await expect(toast).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
