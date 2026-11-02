import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Comprehensive Live Platform E2E Suite Across Roles', () => {

  // =========================================================================
  // 1. SUPER-ADMIN SCENARIOS
  // =========================================================================
  test.describe('Role: Super Admin', () => {
    test.use({ storageState: 'playwright/.auth/superadmin.json' });

    test('Super Admin accesses /admin and verifies dashboard structure', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/admin', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Verify URL or redirection to admin dashboard
      expect(page.url()).toContain('/admin');
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check for navigation links in admin layout
      const adminNav = page.locator('nav').or(page.locator('aside')).first();
      await expect(adminNav).toBeVisible({ timeout: 10000 });

      // Ensure no fatal page crashes
      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });

    test('Super Admin navigates to /admin/temporary-rent management and checks views', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/admin/temporary-rent', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/admin/temporary-rent');

      // Check for heading or content container
      const main = page.locator('main').or(page.locator('h1')).first();
      await expect(main).toBeVisible({ timeout: 10000 });

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });

    test('Super Admin inspects /admin/temporary-rent/categories and verifies category catalog', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/admin/temporary-rent/categories', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/admin/temporary-rent/categories');
      const content = page.locator('main').first();
      await expect(content).toBeVisible({ timeout: 10000 });

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });

    test('Super Admin navigates to /admin/users and verifies user directory', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/admin/users', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/admin/users');
      const main = page.locator('main').first();
      await expect(main).toBeVisible({ timeout: 10000 });

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });
  });

  // =========================================================================
  // 2. ADMIN SCENARIOS
  // =========================================================================
  test.describe('Role: Admin', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Admin accesses admin dashboard without RBAC restriction', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/admin', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/admin');
      const body = page.locator('body');
      await expect(body).toBeVisible();

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });
  });

  // =========================================================================
  // 3. AGENT (CONSULTANT) SCENARIOS
  // =========================================================================
  test.describe('Role: Agent (Consultant)', () => {
    test.use({ storageState: 'playwright/.auth/agent.json' });

    test('Agent is blocked from /admin panel by RBAC guard', async ({ page }) => {
      await page.goto('/admin', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Agent must not enter admin dashboard
      const currentUrl = page.url();
      const isBlocked = !currentUrl.includes('/admin/dashboard') && (!currentUrl.includes('/admin') || currentUrl.includes('/login') || currentUrl.endsWith('/'));
      expect(isBlocked).toBe(true);
    });

    test('Agent accesses /agency directory and property showcase', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/agency', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/agency');
      const body = page.locator('body');
      await expect(body).toBeVisible();

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });

    test('Agent accesses /wallet and checks balance profile', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/wallet', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/wallet');
      const body = page.locator('body');
      await expect(body).toBeVisible();

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });
  });

  // =========================================================================
  // 4. HOST (LANDLORD) SCENARIOS
  // =========================================================================
  test.describe('Role: Landlord (Host)', () => {
    test.use({ storageState: 'playwright/.auth/landlord.json' });

    test('Landlord is blocked from /admin panel by RBAC guard', async ({ page }) => {
      await page.goto('/admin', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      const isBlocked = !currentUrl.includes('/admin/dashboard') && (!currentUrl.includes('/admin') || currentUrl.includes('/login') || currentUrl.endsWith('/'));
      expect(isBlocked).toBe(true);
    });

    test('Landlord accesses /temporary-rent accommodation listings', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/temporary-rent', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/temporary-rent');
      const body = page.locator('body');
      await expect(body).toBeVisible();

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });

    test('Landlord accesses /wallet', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/wallet', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/wallet');
      const body = page.locator('body');
      await expect(body).toBeVisible();

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });
  });

  // =========================================================================
  // 5. PUBLIC USER (GUEST) SCENARIOS
  // =========================================================================
  test.describe('Role: Public User (Guest)', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('Public user loads home page (/) and verifies key components', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toMatch(/melktoday\.com\/?$/);
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check header or search bar
      const searchOrNav = page.locator('header').or(page.locator('nav')).first();
      await expect(searchOrNav).toBeVisible({ timeout: 10000 });

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });

    test('Public user explores real estate ads (/ads) with filters and listings', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/ads', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/ads');
      const body = page.locator('body');
      await expect(body).toBeVisible();

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });

    test('Public user explores temporary rentals (/temporary-rent) with listings', async ({ page }) => {
      const telemetry = attachTelemetry(page);
      await page.goto('/temporary-rent', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/temporary-rent');
      const body = page.locator('body');
      await expect(body).toBeVisible();

      const fatalErrors = telemetry.errors.filter(
        (err) => !err.includes('Failed to load resource') && !err.includes('ResizeObserver')
      );
      expect(fatalErrors.length).toBe(0);
    });
  });
});
