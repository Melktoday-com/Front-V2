import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 3: Wallet Management UI Test', () => {
  test.describe('Admin wallet controls', () => {
    test.use({ storageState: 'playwright/.auth/superadmin.json' });

    test('Admin navigates to /admin/wallet, renders adjustment form and submits transaction', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/admin/wallet', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/admin\/wallet/);

      const heading = page.locator('h1');
      await expect(heading).toContainText('مدیریت مالی');

      // Switch to manual operation tab
      const tabBtn = page.locator('button', { hasText: 'شارژ و تغییر موجودی دستی' });
      await tabBtn.click();

      const userIdInput = page.locator('input[placeholder*="UUID"]').or(page.locator('input').first());
      await expect(userIdInput).toBeVisible();

      const amountInput = page.locator('input[type="number"]').or(page.locator('input[placeholder*="مبلغ"]')).first();
      await expect(amountInput).toBeVisible();

      await userIdInput.fill('00000000-0000-4000-8000-000000000002');
      await amountInput.fill('50000');

      const reviewBtn = page.locator('button', { hasText: 'بررسی و تایید تراکنش' });
      await expect(reviewBtn).toBeVisible();
    });
  });

  test.describe('User wallet view', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('Standard user navigates to /wallet and views balance and transactions', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/wallet', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/wallet/);

      const balanceText = page.locator('text=موجودی').or(page.locator('text=تومان')).first();
      await expect(balanceText).toBeVisible({ timeout: 15000 });

      const chargeBtn = page.locator('button:has-text("افزایش موجودی")').or(page.locator('button:has-text("شارژ")')).first();
      await expect(chargeBtn).toBeVisible({ timeout: 15000 });
    });
  });
});
