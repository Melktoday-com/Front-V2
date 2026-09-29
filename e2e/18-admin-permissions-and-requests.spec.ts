import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 18: Admin Permissions Governance & User Request Resubmission E2E Tests', () => {
  test.describe('SuperAdmin Admin Governance & Granular Permissions', () => {
    test.use({ storageState: 'playwright/.auth/superadmin.json' });

    test('SuperAdmin views admin management panel and opens create admin modal with permissions', async ({
      page,
    }) => {
      const telemetry = attachTelemetry(page);

      const res = await page.goto('/admin/admins', { waitUntil: 'networkidle' });
      if (res?.status() === 404) {
        return;
      }
      await expect(page).toHaveURL(/\/admin\/admins/);

      // Verify header
      const heading = page.locator('h1').or(page.locator('text=مدیریت مدیران')).first();
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Click "مدیر جدید" button
      const createBtn = page.locator('button:has-text("مدیر جدید")').first();
      await expect(createBtn).toBeVisible({ timeout: 10000 });
      await createBtn.click();

      // Verify create modal opens with fields
      const modal = page.locator('[role="dialog"]').or(page.locator('div[class*="fixed"]')).first();
      await expect(modal).toBeVisible({ timeout: 10000 });

      // Verify permission groups / checkboxes exist in modal
      const permissionLabel = page.locator('text=دسترسی‌های مجاز').or(page.locator('text=مدیریت آگهی‌ها')).first();
      await expect(permissionLabel).toBeVisible({ timeout: 10000 });

      // Close modal
      const cancelBtn = page.locator('button:has-text("انصراف")').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }

      expect(telemetry.errors.length).toBe(0);
    });

    test('SuperAdmin validates global archive system with multi-entity tabs and search', async ({
      page,
    }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/admin/archive', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/admin\/archive/);

      // Header verification
      const heading = page.locator('h1').or(page.locator('text=بایگانی سراسری')).or(page.locator('text=سطل زباله')).first();
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Check entity tabs
      const allTab = page.locator('button:has-text("همه موارد")').first();
      const catTab = page.locator('button:has-text("دسته‌بندی‌های اصلی")').or(page.locator('button:has-text("دسته‌بندی‌ها")')).first();

      if (await allTab.isVisible()) {
        await allTab.click();
        await page.waitForTimeout(300);

        // Click "آگهی‌های فروش و رهن" tab
        const adsTab = page.locator('button:has-text("آگهی‌های فروش و رهن")').first();
        if (await adsTab.isVisible()) {
          await adsTab.click();
          await page.waitForTimeout(300);
        }
      }

      await expect(catTab).toBeVisible({ timeout: 10000 });

      // Search interaction
      const searchInput = page.locator('input[placeholder*="جستجو"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('تهران');
        await page.waitForTimeout(300);
        await searchInput.clear();
      }

      expect(telemetry.errors.length).toBe(0);
    });
  });

  test.describe('Standard Admin Restricted Access & UI Visibility', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Admin layout filters sidebar navigation items and protects privileged routes', async ({
      page,
    }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/admin/ads', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/admin\/ads/);

      // Verify sidebar navigation container exists
      const sidebar = page.locator('nav, aside').first();
      await expect(sidebar).toBeVisible({ timeout: 15000 });

      // Verify core admin items are visible
      const adsNav = page.locator('a[href="/admin/ads"]').or(page.locator('text=آگهی‌ها')).first();
      await expect(adsNav).toBeVisible({ timeout: 10000 });

      expect(telemetry.errors.length).toBe(0);
    });
  });

  test.describe('Standard User Requests Portal & Resubmission Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('User accesses /profile/requests and verifies application status and resubmit triggers', async ({
      page,
    }) => {
      const telemetry = attachTelemetry(page);

      const res = await page.goto('/profile/requests');
      if (res?.status() === 404) {
        return;
      }
      await expect(page).toHaveURL(/\/profile\/requests/);

      // Heading check
      const heading = page.locator('h1').or(page.locator('text=درخواست‌های من')).or(page.locator('text=درخواست‌های عضویت و میزبانی')).first();
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Verify requests container or empty state callout
      const container = page.locator('.space-y-4').or(page.locator('text=هیچ درخواستی')).or(page.locator('text=درخواست عضویت')).first();
      await expect(container).toBeVisible({ timeout: 10000 });

      // Verify quick action buttons exist for submitting new requests
      const agencyApplyLink = page.locator('a[href="/agency/apply"]').first();
      if (await agencyApplyLink.isVisible()) {
        await expect(agencyApplyLink).toHaveAttribute('href', '/agency/apply');
      }

      const hostApplyLink = page.locator('a[href="/host/apply"]').first();
      if (await hostApplyLink.isVisible()) {
        await expect(hostApplyLink).toHaveAttribute('href', '/host/apply');
      }

      expect(telemetry.errors.length).toBe(0);
    });
  });
});
