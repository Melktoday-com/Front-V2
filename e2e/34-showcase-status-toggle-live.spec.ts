import { test, expect } from '@playwright/test';

const BASE_URL = 'https://melktoday.com';
const API_BASE = 'https://melktoday.com/backend/api';

const REFRESH_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhM2RkYzYzNi1lYzFlLTQ0NDMtYjExZi1hM2Y3MzRhZTRiNzQiLCJzZXNzaW9uSWQiOiJkNTYwOGI4OS02MWE1LTRhMGYtYWNhNC1mNjFkZTUzZDQ4NjgiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc5NDM3OTU4NiwiZXhwIjoxNzk0OTg0Mzg2LCJhdWQiOiJtZWxrdG9kYXktYXBpIiwiaXNzIjoibWVsa3RvZGF5In0.tomo4TU-blXxZiZLcfEz9GKq2fnyyCVD60yFlUHcuBc';

const XSRF_TOKEN = '69825bee552916e5cff8a5be4f0736cdc66b70df1093d7bd0772a3569b174179';
const SESSION_ID = 'd5608b89-61a5-4a0f-aca4-f61de53d4868';

async function refreshAndSwitchRole(roleName: 'landlord' | 'agent' | 'super-admin') {
  // 1. Refresh to get fresh token
  const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-xsrf-token': XSRF_TOKEN,
      Cookie: `XSRF-TOKEN=${XSRF_TOKEN}; refresh_token=${REFRESH_TOKEN}`,
    },
    body: JSON.stringify({ refreshToken: REFRESH_TOKEN }),
  });

  const refreshJson = await refreshRes.json();
  const currentAccessToken = refreshJson.data?.accessToken;
  const currentRefreshToken = refreshJson.data?.refreshToken || REFRESH_TOKEN;

  // 2. Switch role
  const switchRes = await fetch(`${API_BASE}/auth/sessions/switch-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-xsrf-token': XSRF_TOKEN,
      Authorization: `Bearer ${currentAccessToken}`,
      Cookie: `XSRF-TOKEN=${XSRF_TOKEN}; access_token=${currentAccessToken}`,
    },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      roleName,
    }),
  });

  const switchJson = await switchRes.json();
  return {
    accessToken: switchJson.data?.accessToken || currentAccessToken,
    refreshToken: switchJson.data?.refreshToken || currentRefreshToken,
  };
}

test.describe('Live Production E2E: Showcase Status Toggle & Confirmation Modals', () => {

  test('1. Agency Panel: Toggle Showcase Status with Persian Confirmation Modal', async ({ page, context }) => {
    const { accessToken, refreshToken } = await refreshAndSwitchRole('agent');

    await context.addCookies([
      { name: 'access_token', value: accessToken, domain: 'melktoday.com', path: '/' },
      { name: 'refresh_token', value: refreshToken, domain: 'melktoday.com', path: '/' },
      { name: 'XSRF-TOKEN', value: XSRF_TOKEN, domain: 'melktoday.com', path: '/' },
    ]);

    await page.goto(`${BASE_URL}/agency/panel`, { waitUntil: 'networkidle' });

    // Verify agency panel loaded
    await expect(page).toHaveURL(/.*\/agency\/panel.*/);

    // Verify showcase status section is visible
    const statusSectionTitle = page.locator('text=وضعیت نمایش ویترین املاک').first();
    await expect(statusSectionTitle).toBeVisible({ timeout: 15000 });

    // Find the status toggle button
    const toggleBtn = page.locator('button:has-text("غیرفعال‌سازی ویترین"), button:has-text("فعال‌سازی مجدد ویترین")').first();
    await expect(toggleBtn).toBeVisible();

    const initialBtnText = (await toggleBtn.innerText()).trim();

    // Click toggle button to open modal
    await toggleBtn.click();

    // Verify confirmation modal opens
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check modal title matches action
    const modalTitle = modal.locator('h3').first();
    await expect(modalTitle).toBeVisible();

    // Test cancel button first
    const cancelBtn = modal.locator('button:has-text("انصراف")');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Open modal again to perform action
    await toggleBtn.click();
    await expect(modal).toBeVisible();

    // Click confirmation button in modal
    const confirmBtn = modal.locator('button:has-text("بله، غیرفعال شود"), button:has-text("تأیید و فعال‌سازی")');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Modal should close after confirmation
    await expect(modal).not.toBeVisible({ timeout: 15000 });

    // Wait a moment for query invalidation and UI state update
    await page.waitForTimeout(2000);

    // Verify button text toggled
    const newToggleBtn = page.locator('button:has-text("غیرفعال‌سازی ویترین"), button:has-text("فعال‌سازی مجدد ویترین")').first();
    const newBtnText = (await newToggleBtn.innerText()).trim();
    expect(newBtnText).not.toEqual(initialBtnText);

    // If it was deactivated, toggle it back to active to restore clean state
    if (newBtnText.includes('فعال‌سازی مجدد ویترین')) {
      await newToggleBtn.click();
      const restoreModal = page.locator('div[role="dialog"]');
      await expect(restoreModal).toBeVisible();
      const restoreConfirm = restoreModal.locator('button:has-text("تأیید و فعال‌سازی")');
      await restoreConfirm.click();
      await expect(restoreModal).not.toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(2000);
      const restoredBtn = page.locator('button:has-text("غیرفعال‌سازی ویترین")').first();
      await expect(restoredBtn).toBeVisible({ timeout: 10000 });
    }
  });

  test('2. Host Panel: Toggle Showcase Status with Persian Confirmation Modal', async ({ page, context }) => {
    const { accessToken, refreshToken } = await refreshAndSwitchRole('landlord');

    await context.addCookies([
      { name: 'access_token', value: accessToken, domain: 'melktoday.com', path: '/' },
      { name: 'refresh_token', value: refreshToken, domain: 'melktoday.com', path: '/' },
      { name: 'XSRF-TOKEN', value: XSRF_TOKEN, domain: 'melktoday.com', path: '/' },
    ]);

    await page.goto(`${BASE_URL}/profile/temporary-rent`, { waitUntil: 'networkidle' });

    // Verify host panel loaded
    await expect(page).toHaveURL(/.*\/profile\/temporary-rent.*/);

    // Verify showcase status section is visible
    const statusSectionTitle = page.locator('text=وضعیت نمایش ویترین میزبان').first();
    await expect(statusSectionTitle).toBeVisible({ timeout: 15000 });

    // Find the status toggle button
    const toggleBtn = page.locator('button:has-text("غیرفعال‌سازی ویترین"), button:has-text("فعال‌سازی مجدد ویترین")').first();
    await expect(toggleBtn).toBeVisible();

    const initialBtnText = (await toggleBtn.innerText()).trim();

    // Click toggle button to open modal
    await toggleBtn.click();

    // Verify confirmation modal opens
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check modal title
    const modalTitle = modal.locator('h3').first();
    await expect(modalTitle).toBeVisible();

    // Test cancel button first
    const cancelBtn = modal.locator('button:has-text("انصراف")');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Open modal again to perform action
    await toggleBtn.click();
    await expect(modal).toBeVisible();

    // Click confirmation button in modal
    const confirmBtn = modal.locator('button:has-text("بله، غیرفعال شود"), button:has-text("تأیید و فعال‌سازی")');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Modal should close after confirmation
    await expect(modal).not.toBeVisible({ timeout: 15000 });

    await page.waitForTimeout(2000);

    // Verify button text toggled
    const newToggleBtn = page.locator('button:has-text("غیرفعال‌سازی ویترین"), button:has-text("فعال‌سازی مجدد ویترین")').first();
    const newBtnText = (await newToggleBtn.innerText()).trim();
    expect(newBtnText).not.toEqual(initialBtnText);

    // If it was deactivated, toggle it back to active to restore clean state
    if (newBtnText.includes('فعال‌سازی مجدد ویترین')) {
      await newToggleBtn.click();
      const restoreModal = page.locator('div[role="dialog"]');
      await expect(restoreModal).toBeVisible();
      const restoreConfirm = restoreModal.locator('button:has-text("تأیید و فعال‌سازی")');
      await restoreConfirm.click();
      await expect(restoreModal).not.toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(2000);
      const restoredBtn = page.locator('button:has-text("غیرفعال‌سازی ویترین")').first();
      await expect(restoredBtn).toBeVisible({ timeout: 10000 });
    }
  });

});
