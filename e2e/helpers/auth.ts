import { Page, expect } from '@playwright/test';

export const SUPERADMIN_PHONE = '09123456786';
export const ADMIN_PHONE = '09123456781';
export const AGENT_PHONE = '09123456782';
export const USER_PHONE = '09123456783';
export const LANDLORD_PHONE = '09123456784';
export const DEFAULT_OTP = '123456';

export interface ConsoleLogger {
  errors: string[];
  warnings: string[];
  failedRequests: string[];
}

export function attachTelemetry(page: Page): ConsoleLogger {
  const telemetry: ConsoleLogger = {
    errors: [],
    warnings: [],
    failedRequests: [],
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      if (msg.text().includes('Failed to load resource')) {
        telemetry.warnings.push(`[Resource Fetch]: ${msg.text()}`);
      } else {
        telemetry.errors.push(`[Console Error]: ${msg.text()}`);
      }
    } else if (msg.type() === 'warning') {
      telemetry.warnings.push(`[Console Warn]: ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    if (
      err.message.includes('Minified React error #418') ||
      err.message.includes('Minified React error #423') ||
      err.message.includes('Hydration failed')
    ) {
      telemetry.warnings.push(`[Hydration Warning]: ${err.message}`);
    } else {
      telemetry.errors.push(`[Uncaught PageError]: ${err.message}`);
    }
  });

  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('/favicon.ico')) {
      telemetry.failedRequests.push(`[HTTP ${res.status()}]: ${res.url()}`);
    }
  });

  return telemetry;
}

export async function loginWithOtp(page: Page, phone: string, otp: string = DEFAULT_OTP) {
  await page.goto('/auth', { waitUntil: 'networkidle' });
  
  const phoneInput = page.locator('input[type="tel"]');
  await expect(phoneInput).toBeVisible({ timeout: 15000 });
  await phoneInput.fill(phone);
  
  const submitPhoneBtn = page.locator('button[type="submit"]');
  await submitPhoneBtn.click();
  
  const otpInput = page.locator('input[maxLength="6"]');
  await expect(otpInput).toBeVisible({ timeout: 15000 });
  await otpInput.fill(otp);
  
  const submitOtpBtn = page.locator('button[type="submit"]');
  await submitOtpBtn.click();
  
  // Wait for redirect away from /auth
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

export async function loginAsSuperAdmin(page: Page) {
  await loginWithOtp(page, SUPERADMIN_PHONE);
}

export async function loginAsAdmin(page: Page) {
  await loginWithOtp(page, ADMIN_PHONE);
}

export async function loginAsAgent(page: Page) {
  await loginWithOtp(page, AGENT_PHONE);
}

export async function loginAsLandlord(page: Page) {
  await loginWithOtp(page, LANDLORD_PHONE);
}

export async function loginAsUser(page: Page) {
  await loginWithOtp(page, USER_PHONE);
}
