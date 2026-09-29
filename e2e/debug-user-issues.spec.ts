import { test, expect } from '@playwright/test';

test.describe('Debug User Issues on Beta', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('Issue 37: Submit ad with Barter (معاوضه)', async ({ page }) => {
    // Collect console logs and dialogs
    page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));

    await page.goto('/ads/submit', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/ads\/submit/);

    // 1. If city selector is open or needs selection, pick Tehran or first city
    const cityBtn = page.locator('button:has-text("انتخاب شهر"), button:has-text("تغییر شهر")').first();
    if (await cityBtn.isVisible()) {
      await cityBtn.click();
      const firstCity = page.locator('button:has-text("تهران")').first();
      if (await firstCity.isVisible()) {
        await firstCity.click();
      }
    }

    // 2. Click residential category ("فروش مسکونی" or "residential_sale")
    const catBtn = page.locator('button:has-text("فروش مسکونی"), button:has-text("فروش مسکونی")').or(
      page.locator('button:has-text("مسکونی")').first()
    ).first();
    if (await catBtn.isVisible()) {
      await catBtn.click();
    }

    // 3. Select subcategory (e.g. آپارتمان)
    await page.waitForTimeout(1000);

    // 4. Select transaction type: معاوضه و تهاتر املاک (PROPERTY_BARTER)
    const barterBtn = page.locator('button:has-text("معاوضه")').first();
    await expect(barterBtn).toBeVisible({ timeout: 10000 });
    console.log('Found Barter button:', await barterBtn.innerText());
    await barterBtn.click();

    // 5. Click Next to go to BASIC_INFO
    const nextBtn1 = page.locator('button:has-text("مرحله بعد"), button:has-text("ادامه")').first();
    await nextBtn1.click();
    await page.waitForTimeout(500);

    // Fill Title & Description
    const titleInput = page.locator('input[placeholder*="آپارتمان"]').first();
    await titleInput.fill('آپارتمان ۱۰۰ متری جهت معاوضه با ویلا');

    const descInput = page.locator('textarea').first();
    await descInput.fill('این یک آگهی تستی برای بررسی خطای معاوضه است و توضیحات ملک به طور کامل ثبت شده است.');

    // Click Next to go to DETAILS
    const nextBtn2 = page.locator('button:has-text("مرحله بعد"), button:has-text("ادامه")').first();
    await nextBtn2.click();
    await page.waitForTimeout(1000);

    // Take screenshot of DETAILS step
    await page.screenshot({ path: 'test-results/issue-37-details.png', fullPage: true });

    // Look for inputs in DETAILS
    const estimatedValueInput = page.locator('input[type="number"]').first();
    if (await estimatedValueInput.isVisible()) {
      await estimatedValueInput.fill('5000000000');
    }

    const exchangeWithInput = page.locator('input[placeholder*="آپارتمان کوچکتر"]').or(
      page.locator('input[type="text"]').first()
    );
    if (await exchangeWithInput.isVisible()) {
      console.log('Filling preferredExchangeWith...');
      await exchangeWithInput.fill('یک واحد آپارتمان در غرب تهران');
    }

    // Click Next
    const nextBtn3 = page.locator('button:has-text("مرحله بعد"), button:has-text("ادامه")').first();
    await nextBtn3.click();
    await page.waitForTimeout(1000);

    // Capture screenshot after clicking Next
    await page.screenshot({ path: 'test-results/issue-37-after-next.png', fullPage: true });

    // Check if error message is displayed
    const errorText = page.locator('text=الزامی است').or(page.locator('.text-red-500'));
    const count = await errorText.count();
    console.log('Error count after trying to proceed with barter:', count);
    for (let i = 0; i < count; i++) {
      console.log('Error message:', await errorText.nth(i).innerText());
    }
  });

  test('Issue 41: Submit independent consultant application at /agency/apply', async ({ page }) => {
    let capturedRequest: any = null;
    let capturedResponse: any = null;

    page.on('request', (req) => {
      if (req.url().includes('/agencies/apply')) {
        capturedRequest = {
          url: req.url(),
          method: req.method(),
          postData: req.postDataJSON(),
        };
      }
    });

    page.on('response', async (res) => {
      if (res.url().includes('/agencies/apply')) {
        capturedResponse = {
          status: res.status(),
          body: await res.text(),
        };
      }
    });

    await page.goto('/agency/apply', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/agency\/apply/);

    await page.screenshot({ path: 'test-results/issue-41-initial.png', fullPage: true });

    // If already has application or shows status, check
    const consultantBtn = page.locator('button:has-text("مشاور املاک مستقل")').or(
      page.locator('button:has-text("مشاور املاک")')
    ).first();

    if (await consultantBtn.isVisible()) {
      await consultantBtn.click();

      // Fill name
      const nameInput = page.locator('input[placeholder*="نام"]').first();
      await nameInput.fill('علی رضایی');

      // Fill national code
      const nationalInput = page.locator('input[placeholder*="کد ملی"], input[placeholder*="۰۰۱۲۳۴۵۶۷۸"]').first();
      await nationalInput.fill('0012345678');

      // Select city
      const cityBtn = page.locator('button:has-text("انتخاب شهر")').first();
      if (await cityBtn.isVisible()) {
        await cityBtn.click();
        const cityItem = page.locator('button:has-text("تهران")').first();
        if (await cityItem.isVisible()) {
          await cityItem.click();
        }
      }

      // Submit form
      const submitBtn = page.locator('button[type="submit"]:has-text("ثبت درخواست")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    console.log('CAPTURED REQUEST:', JSON.stringify(capturedRequest, null, 2));
    console.log('CAPTURED RESPONSE:', JSON.stringify(capturedResponse, null, 2));
    await page.screenshot({ path: 'test-results/issue-41-result.png', fullPage: true });
  });

  test('Issue 38 & 40: Profile Requests & Landlord buttons inspection', async ({ page }) => {
    // Check requests page
    await page.goto('/profile/requests', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/issue-38-requests.png', fullPage: true });

    // Check profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/profile-user.png', fullPage: true });

    // Get all buttons on profile page
    const buttons = await page.locator('button, a').allInnerTexts();
    console.log('Buttons on /profile for normal user:', buttons.filter(b => b.trim().length > 0));
  });
});
