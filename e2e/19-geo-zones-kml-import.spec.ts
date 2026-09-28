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

  test('User inspects neighborhood divisions on the map and filters ads by neighborhood (Tehran & Mashhad)', async ({
    page,
  }) => {
    const telemetry = attachTelemetry(page);

    // 1. Visit Explore / Ads scene for Mashhad
    await page.goto('/ads?cityId=4c01ce1e-d916-484e-87d5-3fcc14227741&cityName=مشهد', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/ads/);

    // 2. Verify Neighborhood Drawer trigger button ("نواحی") is visible
    const drawerTrigger = page.locator('[data-testid="neighborhood-drawer-trigger"]').first();
    await expect(drawerTrigger).toBeVisible({ timeout: 15000 });

    // 3. Open Neighborhood Drawer
    await drawerTrigger.click();
    const drawer = page.locator('[role="dialog"][aria-label="انتخاب محله"]').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });

    // 4. Search and select a neighborhood inside the drawer (e.g. "وکیل اباد")
    const searchInput = drawer.locator('input[placeholder="جستجوی محله..."]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('وکیل اباد');
    await page.waitForTimeout(400);

    const zoneOption = drawer.locator('button:has-text("وکیل اباد")').first();
    await expect(zoneOption).toBeVisible({ timeout: 10000 });
    await zoneOption.click();
    await page.waitForTimeout(300);

    // 5. Close drawer via footer action or close button
    const applyBtn = drawer.locator('button:has-text("نمایش نتایج")').first();
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
    } else {
      await drawer.locator('button[aria-label="بستن"]').click();
    }
    await page.waitForTimeout(400);

    // 6. Verify Selected Zone Tag is displayed under search bar
    const selectedTagsContainer = page.locator('[data-testid="selected-zone-tags"]').first();
    await expect(selectedTagsContainer).toBeVisible({ timeout: 10000 });
    await expect(selectedTagsContainer.locator('text=وکیل اباد').first()).toBeVisible({ timeout: 10000 });

    // 7. Remove tag
    const removeTagBtn = selectedTagsContainer.locator('button[aria-label="حذف محله وکیل اباد"]').first();
    if (await removeTagBtn.isVisible()) {
      await removeTagBtn.click();
      await page.waitForTimeout(400);
      await expect(selectedTagsContainer).not.toBeVisible();
    }

    // 8. Switch to Tehran city
    await page.goto('/ads?cityId=b35c1556-8a65-4809-a851-605ac632f3c1&cityName=تهران', { waitUntil: 'networkidle' });

    // 9. Open drawer for Tehran and select a neighborhood (e.g. "تجریش")
    const tehranTrigger = page.locator('[data-testid="neighborhood-drawer-trigger"]').first();
    await expect(tehranTrigger).toBeVisible({ timeout: 15000 });
    await tehranTrigger.click();

    const tehranDrawer = page.locator('[role="dialog"][aria-label="انتخاب محله"]').first();
    await expect(tehranDrawer).toBeVisible({ timeout: 10000 });

    const tehranSearchInput = tehranDrawer.locator('input[placeholder="جستجوی محله..."]').first();
    await tehranSearchInput.fill('تجریش');
    await page.waitForTimeout(400);

    const tajrishOption = tehranDrawer.locator('button:has-text("تجریش")').first();
    await expect(tajrishOption).toBeVisible({ timeout: 10000 });
    await tajrishOption.click();
    await page.waitForTimeout(300);

    const tehranApplyBtn = tehranDrawer.locator('button:has-text("نمایش نتایج")').first();
    if (await tehranApplyBtn.isVisible()) {
      await tehranApplyBtn.click();
    } else {
      await tehranDrawer.locator('button[aria-label="بستن"]').click();
    }
    await page.waitForTimeout(400);

    // 10. Verify Tehran Selected Tag is shown
    const tehranTags = page.locator('[data-testid="selected-zone-tags"]').first();
    await expect(tehranTags).toBeVisible({ timeout: 10000 });
    await expect(tehranTags.locator('text=تجریش').first()).toBeVisible({ timeout: 10000 });

    // 11. Verify Leaflet Map contains interactive boundary polygon paths
    const leafletMap = page.locator('.leaflet-container').first();
    await expect(leafletMap).toBeVisible({ timeout: 15000 });

    const polygonPaths = page.locator('.leaflet-pane.leaflet-overlay-pane svg path.leaflet-interactive');
    const polygonCount = await polygonPaths.count();
    expect(polygonCount).toBeGreaterThan(0);

    expect(telemetry.errors.length).toBe(0);
  });
});
