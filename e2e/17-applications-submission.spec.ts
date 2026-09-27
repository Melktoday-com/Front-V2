import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 17: Role Applications Submission UI Tests', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('Standard user can open agency/agent application form at /agency/apply', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/agency/apply', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/agency\/apply/);

    // Form or status container should be visible
    const formOrContainer = page.locator('main, form, div[class*="apply"]').first();
    await expect(formOrContainer).toBeVisible({ timeout: 15000 });

    expect(telemetry.errors.length).toBe(0);
  });

  test('Standard user can open host/landlord application form at /host/apply', async ({ page }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/host/apply', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/host\/apply/);

    // Form or status container should be visible
    const formOrContainer = page.locator('main, form, div[class*="apply"]').first();
    await expect(formOrContainer).toBeVisible({ timeout: 15000 });

    expect(telemetry.errors.length).toBe(0);
  });
});
