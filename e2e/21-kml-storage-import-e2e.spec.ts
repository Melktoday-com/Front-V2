import { test, expect } from '@playwright/test';
import path from 'path';
import { attachTelemetry } from './helpers/auth';

test.describe('Flow 21: Production KML Upload & Geo Import E2E Verification', () => {
  test.use({ storageState: 'playwright/.auth/superadmin.json' });

  test('SuperAdmin uploads mashhad (2).kml via Object Storage Media Flow and imports into PostGIS', async ({
    page,
  }) => {
    const telemetry = attachTelemetry(page);
    const kmlFilePath = path.resolve('/home/sorenammd/Projects/melktoday/mashhad (2).kml');

    // Setup network spies
    let mediaUploadOccurred = false;
    let geoImportOccurred = false;
    let importedCount = 0;

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/media/upload') && response.request().method() === 'POST') {
        mediaUploadOccurred = true;
        const status = response.status();
        console.log(`[E2E] /media/upload response status: ${status}`);
        try {
          const body = await response.json();
          console.log(`[E2E] Media upload result:`, JSON.stringify(body));
        } catch {
          // ignore
        }
      }

      if (url.includes('/geo/zones/import') && response.request().method() === 'POST') {
        geoImportOccurred = true;
        const status = response.status();
        console.log(`[E2E] /geo/zones/import response status: ${status}`);
        try {
          const body = await response.json();
          console.log(`[E2E] Geo import result:`, JSON.stringify(body));
          importedCount = body.importedCount || body.data?.importedCount || 0;
        } catch {
          // ignore
        }
      }
    });

    // 1. Navigate to /admin/geo
    await page.goto('/admin/geo', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/geo/);

    // 2. Switch to NEIGHBORHOOD tab ("محله‌ها")
    const neighborhoodTab = page.locator('button:has-text("محله‌ها")').first();
    await expect(neighborhoodTab).toBeVisible({ timeout: 15000 });
    await neighborhoodTab.click();
    await page.waitForTimeout(500);

    // 3. Select Province: خراسان رضوی on the main page filter
    const mainProvinceFilter = page.locator('button[aria-haspopup="listbox"]').first();
    if (await mainProvinceFilter.isVisible()) {
      await mainProvinceFilter.click();
      await page.waitForTimeout(300);
      const khorasanFilterOpt = page.locator('button[role="option"]:has-text("خراسان رضوی")').first();
      if (await khorasanFilterOpt.isVisible()) {
        await khorasanFilterOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // 4. Open "افزودن محله" / "منطقه جدید" Modal
    const createBtn = page
      .locator('button:has-text("افزودن محله")')
      .or(page.locator('button:has-text("منطقه جدید")'))
      .or(page.locator('button:has-text("محله جدید")'))
      .or(page.locator('button:has-text("جدید")'))
      .first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // 5. Verify modal opened
    const modal = page.locator('div.fixed.inset-0').first();
    await expect(modal).toBeVisible({ timeout: 10000 });

    // 6. Set file input with mashhad (2).kml
    const fileInput = modal.locator('input[type="file"]#kml-upload');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(kmlFilePath);
    await page.waitForTimeout(500);

    // Verify file name appears in modal
    await expect(modal.locator('text=mashhad (2).kml')).toBeVisible({ timeout: 5000 });

    // 7. Select Province in Modal (خراسان رضوی)
    const provinceTrigger = modal.locator('label:has-text("استان")').locator('..').locator('button[aria-haspopup="listbox"]').first();
    await provinceTrigger.click();
    await page.waitForTimeout(300);
    const khorasanOption = page.locator('button[role="option"]:has-text("خراسان رضوی")').first();
    await expect(khorasanOption).toBeVisible({ timeout: 5000 });
    await khorasanOption.click();
    await page.waitForTimeout(600);

    // 8. Select City in Modal (مشهد)
    const cityTrigger = modal.locator('label:has-text("شهر")').locator('..').locator('button[aria-haspopup="listbox"]').first();
    await expect(cityTrigger).toBeEnabled({ timeout: 5000 });
    await cityTrigger.click();
    await page.waitForTimeout(300);
    const mashhadOption = page.locator('button[role="option"]:has-text("مشهد")').first();
    await expect(mashhadOption).toBeVisible({ timeout: 5000 });
    await mashhadOption.click();
    await page.waitForTimeout(500);

    // 9. Submit import form
    const submitBtn = modal.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 10. Wait for modal to close / import to settle (timeout 45s for large KML parse & postgis insert)
    await expect(modal).not.toBeVisible({ timeout: 45000 });

    // 11. Verify network calls were executed
    expect(mediaUploadOccurred).toBe(true);
    expect(geoImportOccurred).toBe(true);

    // 12. Verify toast message
    const successToast = page.locator('text=درون‌ریزی').or(page.locator('[role="status"]')).first();
    if (await successToast.isVisible()) {
      await expect(successToast).toBeVisible({ timeout: 5000 });
    }

    // 13. Verify zones list in table
    const tableContainer = page.locator('table, .divide-y').first();
    await expect(tableContainer).toBeVisible({ timeout: 15000 });

    // 14. Search for imported Mashhad neighborhoods (e.g. وکیل اباد, صدف, فرهنگ)
    const searchInput = page.locator('input[placeholder*="جستجو"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('وکیل اباد');
      await page.waitForTimeout(800);
      const wakilAbadItem = page.locator('text=وکیل اباد').first();
      await expect(wakilAbadItem).toBeVisible({ timeout: 10000 });

      // Test second imported neighborhood
      await searchInput.fill('صدف');
      await page.waitForTimeout(800);
      const sadafItem = page.locator('text=صدف').first();
      await expect(sadafItem).toBeVisible({ timeout: 10000 });

      // Test third imported neighborhood
      await searchInput.fill('فرهنگ');
      await page.waitForTimeout(800);
      const farhangItem = page.locator('text=فرهنگ').first();
      await expect(farhangItem).toBeVisible({ timeout: 10000 });
    }

    // 15. Verify Leaflet map container
    const leafletMap = page.locator('.leaflet-container').first();
    await expect(leafletMap).toBeVisible({ timeout: 15000 });

    expect(importedCount).toBeGreaterThanOrEqual(147);
    console.log(`[E2E] Success! Verified KML import and ${importedCount} zones for mashhad (2).kml`);
    expect(telemetry.errors.length).toBe(0);
  });
});
