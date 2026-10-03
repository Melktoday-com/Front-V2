import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 23: Complete Ticketing & Support Bounded Context E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('selectedCity', JSON.stringify({ id: 'tehran-id', name: 'تهران' }));
      } catch {}
    });
  });

  // ── 1. USER FLOATING WIDGET & FLOW ──────────────────────────────────────────
  test.describe('User Ticketing Widget Experience', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('User sees floating support button at bottom-left and opens widget', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Floating button must exist and have label/icon
      const floatingBtn = page.locator('aside[aria-label="پشتیبانی و تیکت"] button[aria-label="پشتیبانی و تیکت"]');
      await expect(floatingBtn).toBeVisible({ timeout: 15000 });

      // Click to open floating widget dialog
      await floatingBtn.click({ force: true });

      // Dialog container should be visible
      const dialog = page.locator('div[role="dialog"][aria-modal="true"]');
      await expect(dialog).toBeVisible({ timeout: 10000 });
      await expect(dialog).toContainText('پشتیبانی ملک‌تودی');

      // Check tabs: "تیکت‌های من" and "تیکت جدید"
      const newTicketTab = page.locator('button:has-text("تیکت جدید")');
      if (await newTicketTab.isVisible({ timeout: 5000 })) {
        await newTicketTab.click({ force: true });
      }

      // Topics must be dynamically loaded from backend
      const topicSelector = page.locator('#ticket-topic-select');
      await expect(topicSelector).toBeVisible({ timeout: 10000 });
      const topicButtons = topicSelector.locator('button');
      await expect(topicButtons.first()).toBeVisible({ timeout: 10000 });

      // Keyboard navigation: Escape key closes the widget dialog
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
      await expect(floatingBtn).toBeVisible({ timeout: 5000 });

      expect(telemetry.errors.length).toBe(0);
    });

    test('User creates a ticket via widget and posts a reply', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Open widget
      const floatingBtn = page.locator('aside[aria-label="پشتیبانی و تیکت"] button[aria-label="پشتیبانی و تیکت"]');
      await expect(floatingBtn).toBeVisible({ timeout: 15000 });
      await floatingBtn.click({ force: true });

      // Ensure widget dialog opened
      const dialog = page.locator('div[role="dialog"][aria-modal="true"]');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Go to new ticket tab
      const newTicketTab = page.locator('button:has-text("تیکت جدید")');
      if (await newTicketTab.isVisible({ timeout: 5000 })) {
        await newTicketTab.click({ force: true });
      }

      // Select first topic
      const firstTopic = page.locator('#ticket-topic-select button').first();
      await expect(firstTopic).toBeVisible({ timeout: 10000 });
      await firstTopic.click({ force: true });

      // Fill Subject
      const uniqueSubject = `تست سیستمی تیکت فرانت‌وند ${Date.now()}`;
      const subjectInput = page.locator('#ticket-subject-input');
      await subjectInput.fill(uniqueSubject);

      // Fill Initial Message
      const messageInput = page.locator('#ticket-message-input');
      await messageInput.fill('این یک پیام آزمایشی برای تایید جریان کامل ثبت تیکت در رابط کاربری است.');

      // Submit
      const submitBtn = page.locator('button[type="submit"]:has-text("ارسال تیکت به پشتیبانی")');
      await submitBtn.click();

      // Should transition to conversation view
      await expect(page.locator('div[role="dialog"]')).toContainText(uniqueSubject, { timeout: 15000 });

      // Message history should show user initial message
      await expect(page.locator('div[role="dialog"]')).toContainText(
        'این یک پیام آزمایشی برای تایید جریان کامل ثبت تیکت در رابط کاربری است.',
        { timeout: 10000 }
      );

      // Send a follow-up reply
      const replyTextarea = page.locator('textarea[placeholder*="پاسخ خود را بنویسید"]');
      await expect(replyTextarea).toBeVisible({ timeout: 10000 });
      await replyTextarea.fill('پاسخ پیگیری کاربر برای بررسی ادمین');

      const sendReplyBtn = page.locator('button[aria-label="ارسال پاسخ"]');
      await sendReplyBtn.click();

      // Message should appear in message history
      await expect(page.locator('div[role="dialog"]')).toContainText(
        'پاسخ پیگیری کاربر برای بررسی ادمین',
        { timeout: 10000 }
      );

      expect(telemetry.errors.length).toBe(0);
    });
  });

  // ── 2. ADMIN TICKETING PANEL & ACCESS CONTROL ───────────────────────────────
  test.describe('Admin Ticket Management Panel', () => {
    test.describe('SuperAdmin Authorized Access', () => {
      test.use({ storageState: 'playwright/.auth/superadmin.json' });

      test('SuperAdmin navigates to /admin/tickets and inspects ticket list and details', async ({ page }) => {
        const telemetry = attachTelemetry(page);

        await page.goto('/admin/tickets', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL(/\/admin\/tickets/);

        // Page Title
        const heading = page.locator('h1');
        await expect(heading).toContainText('مدیریت تیکت‌های پشتیبانی', { timeout: 15000 });

        // Filter controls
        const searchInput = page.locator('input[placeholder*="جستجو"]');
        await expect(searchInput).toBeVisible({ timeout: 10000 });

        const statusSelect = page.locator('select').first();
        await expect(statusSelect).toBeVisible({ timeout: 10000 });

        // Click first ticket card
        const firstTicketHeader = page.locator('h4').first();
        if (await firstTicketHeader.isVisible({ timeout: 5000 })) {
          await firstTicketHeader.click({ force: true });

          // Detail container should show user ID and timestamps
          const detailContainer = page.locator('text=شناسه کاربر:');
          await expect(detailContainer).toBeVisible({ timeout: 10000 });
        }

        expect(telemetry.errors.length).toBe(0);
      });
    });

    test.describe('Scoped Admin Permission Denial', () => {
      test.use({ storageState: 'playwright/.auth/admin.json' });

      test('Admin lacking tickets.view is denied access with proper 403 state', async ({ page }) => {
        const telemetry = attachTelemetry(page);

        await page.goto('/admin/tickets', { waitUntil: 'networkidle' });

        // Should render AccessGuard / 403 state
        const deniedText = page.locator('text=عدم دسترسی به این بخش').or(page.locator('text=عدم دسترسی به ماژول تیکتینگ'));
        await expect(deniedText).toBeVisible({ timeout: 15000 });

        expect(telemetry.errors.length).toBe(0);
      });
    });
  });

  // ── 3. SUPERADMIN TOPIC CATALOG & SECURITY ──────────────────────────────────
  test.describe('SuperAdmin Topic Catalog Management', () => {
    test.describe('SuperAdmin Access', () => {
      test.use({ storageState: 'playwright/.auth/superadmin.json' });

      test('SuperAdmin navigates to /admin/ticket-topics and inspects topic management', async ({ page }) => {
        const telemetry = attachTelemetry(page);

        await page.goto('/admin/ticket-topics', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL(/\/admin\/ticket-topics/);

        // Verify title
        const pageHeader = page.locator('h1');
        await expect(pageHeader).toContainText('مدیریت موضوعات تیکت', { timeout: 15000 });

        // Verify table and action buttons
        const createBtn = page.locator('button:has-text("موضوع جدید")');
        await expect(createBtn).toBeVisible({ timeout: 10000 });

        expect(telemetry.errors.length).toBe(0);
      });
    });

    test.describe('Scoped Admin Denial on Topic Catalog', () => {
      test.use({ storageState: 'playwright/.auth/admin.json' });

      test('Scoped Admin cannot manage ticket topics and receives 403 denial state', async ({ page }) => {
        const telemetry = attachTelemetry(page);

        await page.goto('/admin/ticket-topics', { waitUntil: 'networkidle' });

        const deniedState = page.locator('text=عدم دسترسی به این بخش').or(page.locator('text=دسترسی مخصوص راهبر ارشد'));
        await expect(deniedState).toBeVisible({ timeout: 15000 });

        expect(telemetry.errors.length).toBe(0);
      });
    });
  });

  // ── 4. CHAT ISOLATION VERIFICATION ──────────────────────────────────────────
  test.describe('Strict Chat & Ticketing Isolation', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('Tickets do not leak into /profile/chat or chat conversations', async ({ page }) => {
      const telemetry = attachTelemetry(page);

      await page.goto('/profile/chat', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/profile\/chat/);

      // The chat page should NOT have any ticket topics, ticket status badges, or ticket elements
      const ticketElements = page.locator('text=تیکت پشتیبانی');
      await expect(ticketElements).toHaveCount(0);

      expect(telemetry.errors.length).toBe(0);
    });
  });
});
