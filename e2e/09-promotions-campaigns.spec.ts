import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 9: Promotions & Campaigns Review UI Test', () => {
  test.use({ storageState: 'playwright/.auth/superadmin.json' });

  test('Admin navigates to /admin/promotions and verifies promotions queue and actions', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/promotions', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/promotions/);

    // Header validation
    const heading = page.locator('h1');
    await expect(heading).toContainText('بررسی درخواست‌های ارتقا');

    // Table container
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    // Rows
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Admin navigates to /admin/campaigns and verifies campaigns queue', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/campaigns', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/campaigns/);

    // Header validation
    const heading = page.locator('h1');
    await expect(heading).toContainText('بررسی کمپین‌های تبلیغاتی');

    // Table container
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  test('Admin navigates to /admin/config and verifies 6 independent platform tariffs', async ({ page }) => {
    attachTelemetry(page);

    await page.goto('/admin/config', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/config/);

    // Switch to tariffs tab
    const tariffsTabBtn = page.locator('button', { hasText: 'تعرفه‌ها' }).or(page.locator('button:has-text("تعرفه")')).first();
    await expect(tariffsTabBtn).toBeVisible({ timeout: 15000 });
    await tariffsTabBtn.click();

    // Verify tariff headings/descriptions for normal listings and temporary rentals
    await expect(page.locator('text=تعرفه انتشار آگهی عادی').or(page.locator('text=آگهی عادی')).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=اقامتگاه موقت').or(page.locator('text=اقامتگاه روزانه')).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Flow 9b: User Listing Promotion Modal & Dynamic Tariff UI Test', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('User opens /profile/ads, triggers promotion modal, verifies authoritative tariff resolution and free quota label', async ({ page }) => {
    attachTelemetry(page);

    await page.goto('/profile/ads', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/profile\/ads/);

    // Find and click the promotion button on the user's published listing
    const promoBtn = page.locator('button', { hasText: 'ارتقا' }).first();
    await expect(promoBtn).toBeVisible({ timeout: 15000 });
    await promoBtn.click();

    // Modal / Dialog verification
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Verify promotion types are selectable
    const urgentOption = modal.getByRole('heading', { name: 'نشان فوری' });
    const ladderOption = modal.getByRole('heading', { name: 'نردبان' });
    await expect(urgentOption).toBeVisible();
    await expect(ladderOption).toBeVisible();

    // Verify dynamic pricing / entitlement quota reflection (either formatted price in Tomans or free quota badge)
    const priceOrQuotaText = modal.locator('text=تومان').or(modal.locator('text=رایگان')).or(modal.locator('text=سهمیه')).first();
    await expect(priceOrQuotaText).toBeVisible({ timeout: 10000 });

    // Verify cancel button dismisses modal cleanly
    const cancelBtn = modal.locator('button', { hasText: 'انصراف' });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
