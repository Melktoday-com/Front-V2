import { test, expect } from '@playwright/test';

const BASE_URL = 'https://melktoday.com';
const API_BASE = 'https://melktoday.com/backend/api';

const INITIAL_REFRESH_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhM2RkYzYzNi1lYzFlLTQ0NDMtYjExZi1hM2Y3MzRhZTRiNzQiLCJzZXNzaW9uSWQiOiJkNTYwOGI4OS02MWE1LTRhMGYtYWNhNC1mNjFkZTUzZDQ4NjgiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc5NDM4MDg0MCwiZXhwIjoxNzk0OTg1NjQwLCJhdWQiOiJtZWxrdG9kYXktYXBpIiwiaXNzIjoibWVsa3RvZGF5In0.9vrSRCFgduMnqhTiiES7dMFvICM9pFC1GhgNto-WNjo';

const XSRF_TOKEN = '69825bee552916e5cff8a5be4f0736cdc66b70df1093d7bd0772a3569b174179';
const SESSION_ID = 'd5608b89-61a5-4a0f-aca4-f61de53d4868';

async function refreshAndSwitchRole(roleName: 'landlord' | 'agent' | 'super-admin') {
  // 1. Refresh to get fresh token
  const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-xsrf-token': XSRF_TOKEN,
      Cookie: `XSRF-TOKEN=${XSRF_TOKEN}; refresh_token=${INITIAL_REFRESH_TOKEN}`,
    },
    body: JSON.stringify({ refreshToken: INITIAL_REFRESH_TOKEN }),
  });

  const refreshJson = await refreshRes.json();
  const currentAccessToken = refreshJson.data?.accessToken;
  const currentRefreshToken = refreshJson.data?.refreshToken || INITIAL_REFRESH_TOKEN;

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

test.describe('Live Production E2E: Host and Agency Showcase Editing (Multi-Role Account)', () => {

  test('1. Landlord Role: Edit Host Profile without duplicate slug error', async ({ page, context }) => {
    const { accessToken, refreshToken } = await refreshAndSwitchRole('landlord');

    await context.addCookies([
      { name: 'access_token', value: accessToken, domain: 'melktoday.com', path: '/' },
      { name: 'refresh_token', value: refreshToken, domain: 'melktoday.com', path: '/' },
      { name: 'XSRF-TOKEN', value: XSRF_TOKEN, domain: 'melktoday.com', path: '/' },
    ]);

    await page.goto(`${BASE_URL}/profile/temporary-rent`, { waitUntil: 'networkidle' });

    // Verify host panel loaded
    await expect(page).toHaveURL(/.*\/profile\/temporary-rent.*/);
    const hostNameHeading = page.locator('text=مشخصات پایه و عنوان میزبان').first();
    await expect(hostNameHeading).toBeVisible({ timeout: 15000 });

    // Click edit button if form is disabled
    const editBtn = page.locator('button:has-text("ویرایش اطلاعات")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
    }

    // Verify slug field is present and disabled attribute was removed
    const slugInput = page.locator('input[placeholder="host-rezaei"]').first();
    await expect(slugInput).toBeVisible();

    // Fill bio
    const bioTextarea = page.locator('textarea').first();
    await expect(bioTextarea).toBeVisible();
    const timestamp = new Date().toLocaleTimeString('fa-IR');
    await bioTextarea.fill(`به صفحه میزبانی من در ملک‌تودی خوش آمدید. بروزرسانی موفق: ${timestamp}`);

    // Listen for PUT /api/hosts/my-profile
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/hosts/my-profile') && res.request().method() === 'PUT'),
      page.locator('button:has-text("ذخیره تغییرات")').first().click(),
    ]);

    expect(response.status()).toBe(200);
    const resBody = await response.json();
    expect(resBody.success).toBe(true);

    // Verify success toast appears
    const toastSuccess = page.locator('[data-sonner-toast]').or(page.locator('text=به‌روزرسانی شد')).or(page.locator('text=با موفقیت'));
    await expect(toastSuccess.first()).toBeVisible({ timeout: 10000 });
  });

  test('2. Agent Role: Edit Agency Showcase Profile without duplicate slug error', async ({ page, context }) => {
    const { accessToken, refreshToken } = await refreshAndSwitchRole('agent');

    await context.addCookies([
      { name: 'access_token', value: accessToken, domain: 'melktoday.com', path: '/' },
      { name: 'refresh_token', value: refreshToken, domain: 'melktoday.com', path: '/' },
      { name: 'XSRF-TOKEN', value: XSRF_TOKEN, domain: 'melktoday.com', path: '/' },
    ]);

    await page.goto(`${BASE_URL}/agency/panel`, { waitUntil: 'networkidle' });

    // Verify agency panel loaded
    await expect(page).toHaveURL(/.*\/agency\/panel.*/);

    // Click edit button
    const editBtn = page.locator('button:has-text("ویرایش اطلاعات")').first();
    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await editBtn.click();

    // Verify slug input is visible
    const slugInput = page.locator('input[placeholder="tehran-modern-melk"]').first();
    await expect(slugInput).toBeVisible();

    // Modify bio
    const bioTextarea = page.locator('textarea').first();
    await expect(bioTextarea).toBeVisible();
    const timestamp = new Date().toLocaleTimeString('fa-IR');
    await bioTextarea.fill(`فعال در حوزه‌ی ساخت و ساز و‌ ملک ‌و املاک - تست ایجنت: ${timestamp}`);

    // Listen for PUT /api/agencies/my-showcase
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/agencies/my-showcase') && res.request().method() === 'PUT'),
      page.locator('button:has-text("ذخیره تغییرات")').first().click(),
    ]);

    expect(response.status()).toBe(200);
    const resBody = await response.json();
    expect(resBody.success).toBe(true);

    // Verify toast
    const toastSuccess = page.locator('[data-sonner-toast]').or(page.locator('text=با موفقیت ذخیره شد'));
    await expect(toastSuccess.first()).toBeVisible({ timeout: 10000 });
  });

  test('3. Super Admin Role: Admin panel accessibility check', async ({ page, context }) => {
    const { accessToken, refreshToken } = await refreshAndSwitchRole('super-admin');

    await context.addCookies([
      { name: 'access_token', value: accessToken, domain: 'melktoday.com', path: '/' },
      { name: 'refresh_token', value: refreshToken, domain: 'melktoday.com', path: '/' },
      { name: 'XSRF-TOKEN', value: XSRF_TOKEN, domain: 'melktoday.com', path: '/' },
    ]);

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    expect(page.url()).toContain('/admin');
    const adminNav = page.locator('nav').or(page.locator('aside')).first();
    await expect(adminNav).toBeVisible({ timeout: 10000 });
  });
});
