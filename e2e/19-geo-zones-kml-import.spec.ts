import { test, expect } from '@playwright/test';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 19: Urban Divisions & KML Geo Zones E2E Tests (Tehran & Mashhad)', () => {
  test.use({ storageState: 'playwright/.auth/superadmin.json' });

  test('SuperAdmin inspects and manages imported urban divisions and neighborhoods for Mashhad and Tehran', async ({
    page,
  }) => {
    const telemetry = attachTelemetry(page);

    await page.goto('/admin/geo', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/geo/);

    // 1. Verify Header
    const heading = page.locator('h1').or(page.locator('text=مدیریت تقسیمات کشوری و نواحی')).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // 2. Switch category tab to NEIGHBORHOOD (محله‌ها)
    const neighborhoodTab = page.locator('button:has-text("محله‌ها")').first();
    await expect(neighborhoodTab).toBeVisible({ timeout: 10000 });
    await neighborhoodTab.click();
    await page.waitForTimeout(500);

    // 3. Filter by Province: خراسان رضوی & City: مشهد
    const provinceSelect = page.locator('select').first();
    if (await provinceSelect.isVisible()) {
      // Find option with خراسان رضوی (id 109)
      await provinceSelect.selectOption({ label: 'خراسان رضوی' }).catch(async () => {
        const options = await provinceSelect.locator('option').allInnerTexts();
        const khorasan = options.find((o) => o.includes('خراسان رضوی'));
        if (khorasan) await provinceSelect.selectOption({ label: khorasan });
      });
      await page.waitForTimeout(500);

      // Select Mashhad city if city select is available
      const citySelect = page.locator('select').nth(1);
      if (await citySelect.isVisible()) {
        await citySelect.selectOption({ label: 'مشهد' }).catch(async () => {
          const cOptions = await citySelect.locator('option').allInnerTexts();
          const mashhad = cOptions.find((o) => o.includes('مشهد'));
          if (mashhad) await citySelect.selectOption({ label: mashhad });
        });
        await page.waitForTimeout(500);
      }
    }

    // 4. Verify Mashhad neighborhoods are rendered in the table
    const tableContainer = page.locator('table, .divide-y').first();
    await expect(tableContainer).toBeVisible({ timeout: 15000 });

    const mashhadZone = page.locator('text=احمدآباد').or(page.locator('text=بلوار سجاد')).first();
    await expect(mashhadZone).toBeVisible({ timeout: 15000 });

    // 5. Test search filter in Mashhad
    const searchInput = page.locator('input[placeholder*="جستجو"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('احمدآباد');
      await page.waitForTimeout(500);
      const ahmadabadItem = page.locator('text=احمدآباد').first();
      await expect(ahmadabadItem).toBeVisible();
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    // 6. Switch to Tehran Province & City
    if (await provinceSelect.isVisible()) {
      await provinceSelect.selectOption({ label: 'تهران' }).catch(async () => {
        const options = await provinceSelect.locator('option').allInnerTexts();
        const tehran = options.find((o) => o.trim() === 'تهران' || o.includes('تهران'));
        if (tehran) await provinceSelect.selectOption({ label: tehran });
      });
      await page.waitForTimeout(500);

      const citySelect = page.locator('select').nth(1);
      if (await citySelect.isVisible()) {
        await citySelect.selectOption({ label: 'تهران' }).catch(async () => {
          const cOptions = await citySelect.locator('option').allInnerTexts();
          const tehranCity = cOptions.find((o) => o.trim() === 'تهران' || o.includes('تهران'));
          if (tehranCity) await citySelect.selectOption({ label: tehranCity });
        });
        await page.waitForTimeout(500);
      }
    }

    // 7. Verify Tehran neighborhoods are rendered in the table
    const tehranZone = page
      .locator('text=سعادت‌آباد')
      .or(page.locator('text=تجریش'))
      .or(page.locator('text=نیاوران'))
      .first();
    await expect(tehranZone).toBeVisible({ timeout: 15000 });

    // 8. Test search filter in Tehran
    if (await searchInput.isVisible()) {
      await searchInput.fill('سعادت‌آباد');
      await page.waitForTimeout(500);
      const saadatItem = page.locator('text=سعادت‌آباد').first();
      await expect(saadatItem).toBeVisible();
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    // 9. Verify status badge
    const activeBadge = page.locator('text=منتشر شده').or(page.locator('text=فعال')).first();
    await expect(activeBadge).toBeVisible({ timeout: 10000 });

    // 10. Open Create Zone / KML Import Modal
    const createBtn = page.locator('button:has-text("منطقه جدید")').or(page.locator('button:has-text("محله جدید")')).or(page.locator('button:has-text("جدید")')).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      const modal = page.locator('div[class*="fixed"]').first();
      await expect(modal).toBeVisible({ timeout: 10000 });

      // Close modal
      const closeBtn = modal.locator('button').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    expect(telemetry.errors.length).toBe(0);
  });
});
