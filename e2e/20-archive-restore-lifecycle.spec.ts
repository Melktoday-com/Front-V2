import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 20: Comprehensive Archive & Restore Lifecycle Tests', () => {
  test.use({ storageState: 'playwright/.auth/superadmin.json' });

  test('SuperAdmin inspects all entity tabs in /admin/archive', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/archive', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/archive/);

    // Verify main header
    const heading = page.locator('h1').or(page.locator('text=سطل زباله')).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Validate all entity tabs exist
    const tabs = [
      'همه آیتم‌ها',
      'آگهی‌های ملک',
      'اجاره موقت',
      'دسته‌بندی‌ها',
      'زیردسته‌ها',
      'مطالب و پست‌ها',
      'مناطق',
    ];

    for (const tabText of tabs) {
      const tabBtn = page.locator(`button:has-text("${tabText}")`).first();
      await expect(tabBtn).toBeVisible({ timeout: 5000 });
      await tabBtn.click();
      await page.waitForTimeout(400);
    }

    expect(telemetry.errors.length).toBe(0);
  });

  test('Complete Category Archive & Restore Lifecycle: Create -> Archive -> Archive Table -> Restore -> Active Categories Tab', async ({
    page,
    request,
  }) => {
    const telemetry = attachTelemetry(page);
    const uniqueKey = `e2e_cat_${Date.now()}`;
    const uniqueName = `دسته تست بازگردانی ${Date.now()}`;

    // 1. Navigate to Categories management
    await page.goto('/admin/ads?tab=categories', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/ads\?tab=categories/);

    // Click "دسته‌بندی جدید" button
    const newCatBtn = page.locator('button:has-text("دسته‌بندی جدید")').first();
    await expect(newCatBtn).toBeVisible({ timeout: 15000 });
    await newCatBtn.click();

    // Fill create category modal
    const keyInput = page.locator('input[placeholder*="residential"]').or(page.locator('input[name="key"]')).first();
    await expect(keyInput).toBeVisible({ timeout: 10000 });
    await keyInput.fill(uniqueKey);

    const nameInput = page.locator('input[placeholder*="مسکونی"]').or(page.locator('input[name="displayName"]')).first();
    await nameInput.fill(uniqueName);

    const submitBtn = page.locator('button:has-text("ایجاد دسته‌بندی")').first();
    await submitBtn.click();

    // Verify toast or category presence
    await page.waitForTimeout(1500);

    // Search for created category
    const searchInput = page.locator('input[placeholder*="جستجو"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(uniqueName);
      await page.waitForTimeout(500);
    }

    const catHeading = page.locator(`h3:has-text("${uniqueName}")`).first();
    await expect(catHeading).toBeVisible({ timeout: 10000 });

    // 2. Archive the category
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    const archiveBtn = page.locator(`div:has(h3:has-text("${uniqueName}")) button[title*="آرشیو"]`).first();
    if (await archiveBtn.isVisible()) {
      await archiveBtn.click();
    } else {
      // Fallback: look for trash icon next to category
      const row = page.locator(`div:has(h3:has-text("${uniqueName}"))`).first();
      await row.locator('button').last().click();
    }

    await page.waitForTimeout(1500);

    // 3. Navigate to /admin/archive
    await page.goto('/admin/archive', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/archive/);

    // Click categories tab in recycle bin
    const catTab = page.locator('button:has-text("دسته‌بندی‌ها")').first();
    await expect(catTab).toBeVisible({ timeout: 10000 });
    await catTab.click();
    await page.waitForTimeout(500);

    // Search for our archived category in archive
    const archiveSearch = page.locator('input[placeholder*="جستجو"]').first();
    await archiveSearch.fill(uniqueName);
    await page.waitForTimeout(600);

    // Verify it is listed in archive table
    const archivedRowTitle = page.locator(`td:has-text("${uniqueName}")`).first();
    await expect(archivedRowTitle).toBeVisible({ timeout: 10000 });

    // 4. Click "بازگردانی" (Restore) button
    const restoreBtn = page.locator(`tr:has-text("${uniqueName}") button:has-text("بازگردانی")`).first();
    await expect(restoreBtn).toBeVisible({ timeout: 5000 });
    await restoreBtn.click();

    // Verify confirmation modal
    const modal = page.locator('div[class*="fixed"]').filter({ hasText: 'بازگردانی آیتم از سطل زباله' }).first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click "تایید و بازگردانی"
    const confirmRestoreBtn = modal.locator('button:has-text("تایید و بازگردانی")').first();
    await confirmRestoreBtn.click();

    // Verify success toast appears
    const toastMsg = page.locator('text=با موفقیت بازگردانی شد').or(page.locator('text=موفقیت')).first();
    await expect(toastMsg).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(1000);

    // 5. Navigate to /admin/ads?tab=categories and verify the category is restored & visible!
    await page.goto('/admin/ads?tab=categories', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/ads\?tab=categories/);

    // Filter/search for restored category
    const finalSearch = page.locator('input[placeholder*="جستجو"]').first();
    if (await finalSearch.isVisible()) {
      await finalSearch.fill(uniqueName);
      await page.waitForTimeout(600);
    }

    // Verify restored category is rendered in the active list!
    const restoredCat = page.locator(`h3:has-text("${uniqueName}")`).first();
    await expect(restoredCat).toBeVisible({ timeout: 15000 });

    // Clean up: archive it back so it doesn't pollute database
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    const cleanupBtn = page.locator(`div:has(h3:has-text("${uniqueName}")) button[title*="آرشیو"]`).first();
    if (await cleanupBtn.isVisible()) {
      await cleanupBtn.click();
      await page.waitForTimeout(1000);
    }

    expect(telemetry.errors.length).toBe(0);
  });
});
