import https from 'node:https';

const API_BASE = 'https://beta.melktoday.ir/backend/api';
const XSRF_TOKEN = '5caaf73c6ff916f018fd3addeab3c201dc8529078f5db6349a0ad3c875127a22';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: json !== null ? json : data,
            raw: data,
          });
        });
      },
    );

    req.on('error', reject);
    if (options.body) {
      req.write(
        typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body),
      );
    }
    req.end();
  });
}

async function uploadImage(token, fileName = 'sample-e2e.png') {
  // Minimal valid 1x1 PNG binary
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  const boundary = '----WebKitFormBoundaryE2ETestBoundary' + Date.now();
  const headerPart = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`,
  );
  const footerPart = Buffer.from(
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="visibility"\r\n\r\nPUBLIC\r\n--${boundary}\r\nContent-Disposition: form-data; name="mediaType"\r\n\r\nIMAGE\r\n--${boundary}--\r\n`,
  );
  const multipartBody = Buffer.concat([headerPart, pngBuffer, footerPart]);

  return new Promise((resolve, reject) => {
    const parsed = new URL(`${API_BASE}/media/upload`);
    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': multipartBody.length,
          'X-XSRF-TOKEN': XSRF_TOKEN,
          Cookie: `XSRF-TOKEN=${XSRF_TOKEN}; access_token=${token}`,
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(d);
          } catch {}
          resolve({ status: res.statusCode, data: json || d });
        });
      },
    );
    req.on('error', reject);
    req.write(multipartBody);
    req.end();
  });
}

function extractEntity(response, key) {
  if (!response || !response.data) return null;
  const d = response.data;
  if (key && d[key]) return d[key];
  if (key && d.data && d.data[key]) return d.data[key];
  if (d.data) return d.data;
  return d;
}

async function loginUser(mobileNumber) {
  const phone = mobileNumber.startsWith('+')
    ? mobileNumber
    : `+98${mobileNumber.replace(/^0/, '')}`;
  await request(`${API_BASE}/auth/otp/request`, {
    method: 'POST',
    body: { mobileNumber: phone },
  });

  const verifyRes = await request(`${API_BASE}/auth/otp/verify`, {
    method: 'POST',
    body: { mobileNumber: phone, otp: '123456' },
  });

  if (verifyRes.status !== 200 && verifyRes.status !== 201) {
    throw new Error(
      `Login failed for ${mobileNumber}: HTTP ${verifyRes.status} ${JSON.stringify(
        verifyRes.data,
      )}`,
    );
  }

  const token =
    verifyRes.data.accessToken ||
    verifyRes.data.token ||
    verifyRes.data.data?.accessToken;
  const cookieHeader = `XSRF-TOKEN=${XSRF_TOKEN}; access_token=${token}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    'X-XSRF-TOKEN': XSRF_TOKEN,
    Cookie: cookieHeader,
  };

  const meRes = await request(`${API_BASE}/users/me`, { headers });
  const user = meRes.data.data || meRes.data;

  return {
    phone,
    token,
    user,
    userId: user.id || user.userId,
    headers,
  };
}

// Global results aggregator
const report = {
  phases: [],
  summary: { total: 0, passed: 0, failed: 0 },
};

function recordTest(phaseName, testName, passed, details = {}) {
  report.summary.total++;
  if (passed) {
    report.summary.passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    report.summary.failed++;
    console.error(`  [FAIL] ${testName}`, details);
  }
  let p = report.phases.find((x) => x.name === phaseName);
  if (!p) {
    p = { name: phaseName, tests: [] };
    report.phases.push(p);
  }
  p.tests.push({ testName, passed, details });
}

async function runLiveE2ETestSuite() {
  console.log('===============================================================');
  console.log('MELKTODAY LIVE BETA E2E VERIFICATION SUITE');
  console.log('Target: https://beta.melktoday.ir/backend/api');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('===============================================================\n');

  // Track created entities for teardown
  const cleanup = {
    adsCategoryIds: [],
    adsSubcategoryIds: [],
    mediaIds: [],
    adIds: [],
    tempRentCategoryIds: [],
    tempRentSubcategoryIds: [],
    tempRentAdIds: [],
  };

  let superAdmin, admin, normalUser;

  try {
    // ─────────────────────────────────────────────────────────────────
    // Phase 1: Environment & Authentication
    // ─────────────────────────────────────────────────────────────────
    console.log('--- Phase 1: Environment & Auth Verification ---');
    const healthLive = await request(`${API_BASE}/health/live`);
    recordTest(
      'Phase 1',
      'API Health Live Check',
      healthLive.status === 200,
      { status: healthLive.status, body: healthLive.data },
    );

    superAdmin = await loginUser('09123456786');
    recordTest(
      'Phase 1',
      'SuperAdmin OTP Authentication',
      !!superAdmin.userId && !!superAdmin.token,
      { userId: superAdmin.userId, phone: superAdmin.phone },
    );

    admin = await loginUser('09123456781');
    recordTest(
      'Phase 1',
      'Admin OTP Authentication',
      !!admin.userId && !!admin.token,
      { userId: admin.userId, phone: admin.phone },
    );

    normalUser = await loginUser('09123456783');
    recordTest(
      'Phase 1',
      'Normal User OTP Authentication',
      !!normalUser.userId && !!normalUser.token,
      { userId: normalUser.userId, phone: normalUser.phone },
    );

    // Get an active city UUID for test listings
    const citiesRes = await request(`${API_BASE}/geo/cities?limit=5`);
    const citiesData = citiesRes.data?.data?.items || citiesRes.data?.items || [];
    const testCityId = citiesData[0]?.id || '8a85e61c-f906-4283-8d20-add8143413c7';
    console.log(`  Target test city ID: ${testCityId} (${citiesData[0]?.name || 'اراک'})`);

    // Get Ads price model ID for CASH_FREEHOLD_SALE
    const adsPriceModelId = 'ccce0164-02f5-4c68-8599-26ae5eccd4bf';
    const adsPriceModelKey = 'CASH_FREEHOLD_SALE';

    // Get Temp Rent price model ID for DAILY_RENT_STANDARD
    const trPriceModelId = '01768321-e030-4433-b33b-7dd9d1b8a222';
    const trPriceModelKey = 'DAILY_RENT_STANDARD';

    // ─────────────────────────────────────────────────────────────────
    // Phase 2: Ads Category & Subcategory Management Lifecycle
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 2: Ads Category & Subcategory Management Lifecycle ---');
    const ts = Date.now();
    const initialCatKey = `e2e_cat_${ts}`;
    const initialCatName = `دسته تست هویت ${ts}`;

    // 2.1: Create Category
    const createCatRes = await request(`${API_BASE}/ads/categories`, {
      method: 'POST',
      headers: superAdmin.headers,
      body: {
        key: initialCatKey,
        displayName: initialCatName,
        description: 'ایجاد شده توسط آزمون هویت کتگوری',
        icon: 'building',
        displayOrder: 999,
      },
    });
    const createdCat = extractEntity(createCatRes, 'category');
    const catId = createdCat?.id;
    if (catId) cleanup.adsCategoryIds.push(catId);

    recordTest(
      'Phase 2',
      '2.1: Create Category (Admin)',
      createCatRes.status === 201 && !!catId && createdCat.key === initialCatKey,
      { status: createCatRes.status, catId, key: createdCat?.key },
    );

    // 2.2: Add Subcategory
    const initialSubcatKey = `e2e_subcat_${ts}`;
    const initialSubcatName = `زیردسته آزمایشی ${ts}`;
    const createSubcatRes = await request(`${API_BASE}/ads/categories/${catId}/subcategories`, {
      method: 'POST',
      headers: superAdmin.headers,
      body: {
        key: initialSubcatKey,
        displayName: initialSubcatName,
        description: 'زیردسته آزمون جامع شناسه فنی',
        icon: 'home',
        displayOrder: 1,
        allowedPriceModelIds: [adsPriceModelId],
        attributes: [
          {
            key: 'floor_count',
            label: 'تعداد طبقات',
            type: 'NUMBER',
            required: false,
            displayOrder: 1,
          },
          {
            key: 'has_parking',
            label: 'پارکینگ',
            type: 'BOOLEAN',
            required: false,
            displayOrder: 2,
          },
        ],
      },
    });
    const createdSubcat = extractEntity(createSubcatRes, 'subcategory');
    const subcatId = createdSubcat?.id;
    if (subcatId) cleanup.adsSubcategoryIds.push(subcatId);

    recordTest(
      'Phase 2',
      '2.2: Add Subcategory with dynamic attributes (Admin)',
      createSubcatRes.status === 201 && !!subcatId && createdSubcat.key === initialSubcatKey,
      { status: createSubcatRes.status, subcatId, key: createdSubcat?.key },
    );

    // 2.3: Verify Subcategory Config Endpoint (UUID lookup)
    const configRes = await request(`${API_BASE}/ads/subcategories/${subcatId}/config`);
    const configData = configRes.data?.data || configRes.data;
    const hasSubcat = configData?.subcategory?.id === subcatId;
    const hasAttributes = Array.isArray(configData?.attributeDefinitions) || Array.isArray(configData?.attributes);

    recordTest(
      'Phase 2',
      '2.3: Get Subcategory Config by Subcategory UUID',
      configRes.status === 200 && hasSubcat && hasAttributes,
      { status: configRes.status, subcat: configData?.subcategory?.displayName },
    );

    // 2.4: Update Category Technical Key & Display Name
    const updatedCatKey = `e2e_cat_renamed_${ts}`;
    const updatedCatName = `دسته تغییر یافته ${ts}`;
    const updateCatRes = await request(`${API_BASE}/ads/categories/${catId}`, {
      method: 'PATCH',
      headers: superAdmin.headers,
      body: {
        key: updatedCatKey,
        displayName: updatedCatName,
      },
    });
    const updatedCat = extractEntity(updateCatRes, 'category');

    recordTest(
      'Phase 2',
      '2.4: Update Category Key (UUID invariant)',
      updateCatRes.status === 200 && updatedCat?.id === catId && updatedCat?.key === updatedCatKey,
      { status: updateCatRes.status, id: updatedCat?.id, expectedId: catId, newKey: updatedCat?.key },
    );

    // 2.5: Update Subcategory Technical Key & Display Name
    const updatedSubcatKey = `e2e_subcat_renamed_${ts}`;
    const updatedSubcatName = `زیردسته ویرایش شده ${ts}`;
    const updateSubcatRes = await request(`${API_BASE}/ads/subcategories/${subcatId}`, {
      method: 'PATCH',
      headers: superAdmin.headers,
      body: {
        key: updatedSubcatKey,
        displayName: updatedSubcatName,
      },
    });
    const updatedSubcat = extractEntity(updateSubcatRes, 'subcategory');

    recordTest(
      'Phase 2',
      '2.5: Update Subcategory Key (UUID invariant)',
      updateSubcatRes.status === 200 && updatedSubcat?.id === subcatId && updatedSubcat?.key === updatedSubcatKey,
      { status: updateSubcatRes.status, id: updatedSubcat?.id, expectedId: subcatId, newKey: updatedSubcat?.key },
    );

    // 2.6a: Validation Constraints (Regex validation rejection)
    const invalidKeyRes = await request(`${API_BASE}/ads/categories/${catId}`, {
      method: 'PATCH',
      headers: superAdmin.headers,
      body: {
        key: 'INVALID KEY WITH SPACES & SYMBOLS!@#',
      },
    });
    recordTest(
      'Phase 2',
      '2.6a: Reject invalid key characters (Regex validation)',
      invalidKeyRes.status === 400 || invalidKeyRes.status === 422,
      { status: invalidKeyRes.status, data: invalidKeyRes.data },
    );

    // 2.6b: Create a secondary category to test duplicate collision
    const dupCatKey = `e2e_dup_cat_${ts}`;
    const createDupCat = await request(`${API_BASE}/ads/categories`, {
      method: 'POST',
      headers: superAdmin.headers,
      body: { key: dupCatKey, displayName: 'دسته دوم تست' },
    });
    const dupCat = extractEntity(createDupCat, 'category');
    const dupCatId = dupCat?.id;
    if (dupCatId) cleanup.adsCategoryIds.push(dupCatId);

    const duplicateKeyAttempt = await request(`${API_BASE}/ads/categories/${dupCatId}`, {
      method: 'PATCH',
      headers: superAdmin.headers,
      body: { key: updatedCatKey }, // Try to duplicate updatedCatKey
    });
    recordTest(
      'Phase 2',
      '2.6b: Reject duplicate key within same scope (Conflict 409 or Validation 422)',
      duplicateKeyAttempt.status === 409 || duplicateKeyAttempt.status === 422 || duplicateKeyAttempt.status === 400,
      { status: duplicateKeyAttempt.status, data: duplicateKeyAttempt.data },
    );

    // ─────────────────────────────────────────────────────────────────
    // Phase 3: Ad Lifecycle & Cascading Updates Verification
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 3: Ad Lifecycle & Cascading Updates Verification ---');

    // 3.0: Upload verified test media image for publish policy compliance
    const uploadMediaRes = await uploadImage(normalUser.token, `ad-photo-${ts}.png`);
    const mediaPayload = extractEntity(uploadMediaRes);
    const testMediaId = mediaPayload?.id || mediaPayload?.mediaId;
    if (testMediaId) cleanup.mediaIds.push(testMediaId);
    console.log(`  Uploaded test media ID: ${testMediaId} (Status: ${uploadMediaRes.status})`);

    // 3.1: Create Ad Draft referencing the category and subcategory
    const adDraftPayload = {
      cityId: testCityId,
      categoryPath: {
        categoryKey: updatedCatKey,
        subcategoryKey: updatedSubcatKey,
        businessModelKey: adsPriceModelKey,
        attributeSchemaVersion: 1,
      },
      title: `آگهی آزمایشی با کلید پویا ${ts}`,
      description: 'این آگهی جهت سنجش یکپارچگی ویرایش کلید فنی ثبت شده است.',
      rawPricing: {
        totalPrice: 4500000000,
      },
      attributes: {
        floor_count: 5,
        has_parking: true,
      },
      latitude: 35.7219,
      longitude: 51.3347,
      mediaIds: testMediaId ? [testMediaId] : [],
    };

    const createDraftRes = await request(`${API_BASE}/ads/drafts`, {
      method: 'POST',
      headers: normalUser.headers,
      body: adDraftPayload,
    });
    const draftData = extractEntity(createDraftRes);
    const adId = draftData?.adId || draftData?.id;
    if (adId) cleanup.adIds.push(adId);

    recordTest(
      'Phase 3',
      '3.1: Create Ad Draft with test CategoryPath, Attributes & Media',
      createDraftRes.status === 201 && !!adId,
      { status: createDraftRes.status, adId, data: createDraftRes.data },
    );

    // 3.2: Submit Ad For Review
    const submitReviewRes = await request(`${API_BASE}/ads/${adId}/submit-for-review`, {
      method: 'POST',
      headers: normalUser.headers,
    });
    const submitData = extractEntity(submitReviewRes);
    recordTest(
      'Phase 3',
      '3.2: Submit Ad For Review',
      submitReviewRes.status === 200 && submitData?.status === 'PENDING_APPROVAL',
      { status: submitReviewRes.status, adStatus: submitData?.status },
    );

    // 3.3: Approve Ad (SuperAdmin)
    const approveAdRes = await request(`${API_BASE}/ads/${adId}/approve`, {
      method: 'POST',
      headers: superAdmin.headers,
    });
    const approveData = extractEntity(approveAdRes);
    recordTest(
      'Phase 3',
      '3.3: Approve Ad by Admin (PUBLISHED state)',
      approveAdRes.status === 200 && approveData?.status === 'PUBLISHED',
      { status: approveAdRes.status, adStatus: approveData?.status },
    );

    // 3.4: Perform Subcategory Key Mutation & Verify Cascading
    const cascadedSubcatKey = `e2e_subcat_cascaded_${ts}`;
    console.log(`  Mutating subcategory key from '${updatedSubcatKey}' -> '${cascadedSubcatKey}'...`);
    const mutateSubcatRes = await request(`${API_BASE}/ads/subcategories/${subcatId}`, {
      method: 'PATCH',
      headers: superAdmin.headers,
      body: {
        key: cascadedSubcatKey,
      },
    });
    recordTest(
      'Phase 3',
      '3.4: Mutate Subcategory Key to trigger Cascade',
      mutateSubcatRes.status === 200,
      { status: mutateSubcatRes.status },
    );

    // 3.5: Read Ad by ID and assert categoryPath cascaded
    const getAdRes = await request(`${API_BASE}/ads/${adId}`, {
      headers: normalUser.headers,
    });
    const adData = extractEntity(getAdRes, 'ad');
    const cascadedPath = adData?.categoryPath || {};

    const isPathCascaded = cascadedPath.subcategoryKey === cascadedSubcatKey;
    const isAttributesPreserved = adData?.attributes?.floor_count === 5 && adData?.attributes?.has_parking === true;
    const isOwnerPreserved = adData?.ownerId === normalUser.userId;

    recordTest(
      'Phase 3',
      '3.5: Verify Ad categoryPath cascaded and attributes preserved',
      getAdRes.status === 200 && isPathCascaded && isAttributesPreserved && isOwnerPreserved,
      {
        status: getAdRes.status,
        expectedSubcatKey: cascadedSubcatKey,
        actualSubcatKey: cascadedPath.subcategoryKey,
        attributes: adData?.attributes,
        ownerId: adData?.ownerId,
      },
    );

    // 3.6: Edit Ad
    const editAdRes = await request(`${API_BASE}/ads/${adId}`, {
      method: 'PATCH',
      headers: normalUser.headers,
      body: {
        title: `آگهی با عنوان به روز شده ${ts}`,
        description: 'توضیحات اصلاح شده پس از تغییر کلید دسته بندی',
        rawPricing: {
          totalPrice: 4800000000,
        },
        attributes: {
          floor_count: 6,
          has_parking: true,
        },
      },
    });
    recordTest(
      'Phase 3',
      '3.6: Edit Ad after category key mutation',
      editAdRes.status === 200,
      { status: editAdRes.status, data: editAdRes.data },
    );

    // 3.7: Fetch Attribute Definition UUID for 'floor_count'
    const subcatConfigForAttr = await request(`${API_BASE}/ads/subcategories/${subcatId}/config`);
    const subcatConfigData = subcatConfigForAttr.data?.data || subcatConfigForAttr.data;
    const attrDefs = subcatConfigData?.attributeDefinitions || subcatConfigData?.attributes || [];
    const floorAttr = attrDefs.find((a) => a.key === 'floor_count');
    const floorAttrId = floorAttr?.id;

    recordTest(
      'Phase 3',
      '3.7: Retrieve dynamic attribute definition by subcategory',
      !!floorAttrId && floorAttr.key === 'floor_count',
      { floorAttrId, key: floorAttr?.key },
    );

    // 3.8: Rename Attribute Technical Key: 'floor_count' -> 'total_floors'
    if (floorAttrId) {
      const renameAttrRes = await request(`${API_BASE}/ads/subcategories/${subcatId}/attributes/${floorAttrId}`, {
        method: 'PATCH',
        headers: superAdmin.headers,
        body: {
          key: 'total_floors',
          label: 'تعداد کل طبقات ساختمانی',
        },
      });
      const renamedAttrData = extractEntity(renameAttrRes);

      recordTest(
        'Phase 3',
        '3.8: Rename Attribute Technical Key (UUID invariant)',
        renameAttrRes.status === 200 && renamedAttrData?.id === floorAttrId && renamedAttrData?.key === 'total_floors',
        { status: renameAttrRes.status, id: renamedAttrData?.id, expectedId: floorAttrId, newKey: renamedAttrData?.key },
      );

      // 3.9: Verify Subcategory Config reflects new attribute key with preserved UUID
      const updatedConfigRes = await request(`${API_BASE}/ads/subcategories/${subcatId}/config`);
      const updatedConfigData = updatedConfigRes.data?.data || updatedConfigRes.data;
      const updatedAttrDefs = updatedConfigData?.attributeDefinitions || updatedConfigData?.attributes || [];
      const updatedAttr = updatedAttrDefs.find((a) => a.id === floorAttrId);

      recordTest(
        'Phase 3',
        '3.9: Verify Subcategory Config has renamed attribute key',
        updatedConfigRes.status === 200 && updatedAttr?.key === 'total_floors' && updatedAttr?.id === floorAttrId,
        { status: updatedConfigRes.status, attrKey: updatedAttr?.key, attrId: updatedAttr?.id },
      );

      // 3.10: Read Ad and verify JSONB attributes were automatically migrated
      const getAdAfterAttrRename = await request(`${API_BASE}/ads/${adId}`, {
        headers: normalUser.headers,
      });
      const adAfterAttrData = extractEntity(getAdAfterAttrRename, 'ad');
      const adAttrs = adAfterAttrData?.attributes || {};

      const isAttributeMigrated = adAttrs.total_floors === 6 && adAttrs.floor_count === undefined;
      const isOtherAttributeIntact = adAttrs.has_parking === true;

      recordTest(
        'Phase 3',
        '3.10: Verify Ad JSONB attributes cascaded (old key removed, new key populated with value)',
        getAdAfterAttrRename.status === 200 && isAttributeMigrated && isOtherAttributeIntact,
        {
          status: getAdAfterAttrRename.status,
          total_floors: adAttrs.total_floors,
          floor_count: adAttrs.floor_count,
          has_parking: adAttrs.has_parking,
          attributes: adAttrs,
        },
      );

      // 3.11: Create a secondary attribute and test duplicate key conflict rejection
      const createSecondaryAttr = await request(`${API_BASE}/ads/subcategories/${subcatId}/attributes`, {
        method: 'POST',
        headers: superAdmin.headers,
        body: {
          key: 'temp_attr',
          label: 'ویژگی آزمایشی',
          type: 'STRING',
        },
      });
      const secAttr = extractEntity(createSecondaryAttr);
      const secAttrId = secAttr?.id;

      if (secAttrId) {
        const dupAttrAttempt = await request(`${API_BASE}/ads/subcategories/${subcatId}/attributes/${secAttrId}`, {
          method: 'PATCH',
          headers: superAdmin.headers,
          body: {
            key: 'total_floors', // Try to duplicate total_floors
          },
        });

        recordTest(
          'Phase 3',
          '3.11: Reject duplicate attribute key within same subcategory (Conflict 409 or Validation 400)',
          dupAttrAttempt.status === 409 || dupAttrAttempt.status === 400,
          { status: dupAttrAttempt.status, data: dupAttrAttempt.data },
        );

        // 3.12: Reject invalid attribute key format
        const invalidAttrKeyAttempt = await request(`${API_BASE}/ads/subcategories/${subcatId}/attributes/${secAttrId}`, {
          method: 'PATCH',
          headers: superAdmin.headers,
          body: {
            key: 'INVALID KEY WITH SPACES!',
          },
        });

        recordTest(
          'Phase 3',
          '3.12: Reject invalid attribute key format (Regex validation 400)',
          invalidAttrKeyAttempt.status === 400,
          { status: invalidAttrKeyAttempt.status, data: invalidAttrKeyAttempt.data },
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Phase 4: Temporary Rent Parity & Identity Verification
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 4: Temporary Rent Parity & Identity Verification ---');
    const trCatKey = `tr_cat_${ts}`;
    const trCatName = `دسته اجاره روزانه ${ts}`;

    // 4.1: Create Temp Rent Category
    const createTrCatRes = await request(`${API_BASE}/temporary-rent/categories`, {
      method: 'POST',
      headers: superAdmin.headers,
      body: {
        key: trCatKey,
        displayName: trCatName,
        description: 'دسته موقت برای آزمون پاریته اجاره موقت',
        icon: 'villa',
        displayOrder: 999,
      },
    });
    const createdTrCat = extractEntity(createTrCatRes, 'category');
    const trCatId = createdTrCat?.id;
    if (trCatId) cleanup.tempRentCategoryIds.push(trCatId);

    recordTest(
      'Phase 4',
      '4.1: Create Temporary Rent Category (Admin)',
      createTrCatRes.status === 201 && !!trCatId && createdTrCat.key === trCatKey,
      { status: createTrCatRes.status, trCatId, key: createdTrCat?.key },
    );

    // 4.2: Add Temp Rent Subcategory
    const trSubcatKey = `tr_subcat_${ts}`;
    const trSubcatName = `زیردسته اقامتگاه بومگردی ${ts}`;
    const createTrSubcatRes = await request(`${API_BASE}/temporary-rent/categories/${trCatId}/subcategories`, {
      method: 'POST',
      headers: superAdmin.headers,
      body: {
        key: trSubcatKey,
        displayName: trSubcatName,
        description: 'زیردسته اجاره روزانه',
        icon: 'tree',
        displayOrder: 1,
        allowedPriceModelIds: [trPriceModelId],
        attributes: [
          {
            key: 'capacity',
            label: 'ظرفیت نفرات',
            type: 'NUMBER',
            required: false,
            displayOrder: 1,
          },
        ],
      },
    });
    const createdTrSubcat = extractEntity(createTrSubcatRes, 'subcategory');
    const trSubcatId = createdTrSubcat?.id;
    if (trSubcatId) cleanup.tempRentSubcategoryIds.push(trSubcatId);

    recordTest(
      'Phase 4',
      '4.2: Add Temporary Rent Subcategory (Admin)',
      createTrSubcatRes.status === 201 && !!trSubcatId && createdTrSubcat.key === trSubcatKey,
      { status: createTrSubcatRes.status, trSubcatId, key: createdTrSubcat?.key },
    );

    // 4.3: Update Temp Rent Category Key
    const updatedTrCatKey = `tr_cat_renamed_${ts}`;
    const updateTrCatRes = await request(`${API_BASE}/temporary-rent/categories/${trCatId}`, {
      method: 'PATCH',
      headers: superAdmin.headers,
      body: {
        key: updatedTrCatKey,
        displayName: `دسته تغییر یافته اجاره ${ts}`,
      },
    });
    const updatedTrCat = extractEntity(updateTrCatRes, 'category');

    recordTest(
      'Phase 4',
      '4.3: Update Temporary Rent Category Key (UUID invariant)',
      updateTrCatRes.status === 200 && updatedTrCat?.id === trCatId && updatedTrCat?.key === updatedTrCatKey,
      { status: updateTrCatRes.status, id: updatedTrCat?.id, expectedId: trCatId, newKey: updatedTrCat?.key },
    );

    // 4.4: Update Temp Rent Subcategory Key
    const updatedTrSubcatKey = `tr_subcat_renamed_${ts}`;
    const updateTrSubcatRes = await request(`${API_BASE}/temporary-rent/subcategories/${trSubcatId}`, {
      method: 'PATCH',
      headers: superAdmin.headers,
      body: {
        key: updatedTrSubcatKey,
        displayName: `زیردسته تغییر یافته اقامتگاه ${ts}`,
      },
    });
    const updatedTrSubcat = extractEntity(updateTrSubcatRes, 'subcategory');

    recordTest(
      'Phase 4',
      '4.4: Update Temporary Rent Subcategory Key (UUID invariant)',
      updateTrSubcatRes.status === 200 && updatedTrSubcat?.id === trSubcatId && updatedTrSubcat?.key === updatedTrSubcatKey,
      { status: updateTrSubcatRes.status, id: updatedTrSubcat?.id, expectedId: trSubcatId, newKey: updatedTrSubcat?.key },
    );

    // 4.5: Create Temporary Rent Ad Draft
    const now = new Date();
    const from = new Date(now.getTime() + 86400000).toISOString();
    const to = new Date(now.getTime() + 86400000 * 7).toISOString();

    const trAdPayload = {
      cityId: testCityId,
      categoryPath: {
        categoryKey: updatedTrCatKey,
        subcategoryKey: updatedTrSubcatKey,
        attributeSchemaVersion: 1,
      },
      title: `ویلا بومگردی تست شناسه ${ts}`,
      description: 'آگهی اجاره موقت برای راستی آزمایی هویت دسته بندی ها',
      nightlyPrice: 2500000,
      maxGuests: 4,
      availabilityWindow: {
        availableFrom: from,
        availableTo: to,
      },
      priceModelKey: trPriceModelKey,
      pricing: {
        nightlyPrice: 2500000,
      },
      latitude: 36.6542,
      longitude: 51.4231,
      attributes: {
        capacity: 4,
      },
      mediaIds: [],
    };

    const createTrDraftRes = await request(`${API_BASE}/temporary-rent/drafts`, {
      method: 'POST',
      headers: normalUser.headers,
      body: trAdPayload,
    });
    const trDraftData = extractEntity(createTrDraftRes);
    const trAdId = trDraftData?.adId || trDraftData?.id;
    if (trAdId) cleanup.tempRentAdIds.push(trAdId);

    recordTest(
      'Phase 4',
      '4.5: Create Temporary Rent Draft with CategoryPath',
      createTrDraftRes.status === 201 && !!trAdId,
      { status: createTrDraftRes.status, trAdId, data: createTrDraftRes.data },
    );

    // 4.6: Mutate Temp Rent Subcategory Key and Assert Cascade
    const cascadedTrSubcatKey = `tr_subcat_cascaded_${ts}`;
    console.log(`  Mutating Temp Rent subcategory key to '${cascadedTrSubcatKey}'...`);
    const mutateTrSubcatRes = await request(`${API_BASE}/temporary-rent/subcategories/${trSubcatId}`, {
      method: 'PATCH',
      headers: superAdmin.headers,
      body: {
        key: cascadedTrSubcatKey,
      },
    });
    recordTest(
      'Phase 4',
      '4.6: Mutate Temp Rent Subcategory Key',
      mutateTrSubcatRes.status === 200,
      { status: mutateTrSubcatRes.status },
    );

    // 4.7: Read Temp Rent Ad and verify categoryPath cascaded
    const getTrAdRes = await request(`${API_BASE}/temporary-rent/${trAdId}`, {
      headers: normalUser.headers,
    });
    const trAdData = extractEntity(getTrAdRes, 'ad');
    const trCascadedPath = trAdData?.categoryPath || {};

    recordTest(
      'Phase 4',
      '4.7: Verify Temporary Rent categoryPath cascaded correctly',
      getTrAdRes.status === 200 && trCascadedPath.subcategoryKey === cascadedTrSubcatKey,
      {
        status: getTrAdRes.status,
        expectedSubcatKey: cascadedTrSubcatKey,
        actualSubcatKey: trCascadedPath.subcategoryKey,
      },
    );

    // 4.8: Fetch Temp Rent Attribute UUID for 'capacity'
    const trSubcatConfigRes = await request(`${API_BASE}/temporary-rent/subcategories/${trSubcatId}/config`);
    const trSubcatConfigData = trSubcatConfigRes.data?.data || trSubcatConfigRes.data;
    const trAttrDefs = trSubcatConfigData?.attributeDefinitions || trSubcatConfigData?.attributes || [];
    const capacityAttr = trAttrDefs.find((a) => a.key === 'capacity');
    const capacityAttrId = capacityAttr?.id;

    recordTest(
      'Phase 4',
      '4.8: Retrieve Temp Rent attribute definition by subcategory',
      !!capacityAttrId && capacityAttr.key === 'capacity',
      { capacityAttrId, key: capacityAttr?.key },
    );

    // 4.9: Rename Temp Rent Attribute Technical Key: 'capacity' -> 'max_capacity'
    if (capacityAttrId) {
      const renameTrAttrRes = await request(`${API_BASE}/temporary-rent/subcategories/${trSubcatId}/attributes/${capacityAttrId}`, {
        method: 'PATCH',
        headers: superAdmin.headers,
        body: {
          key: 'max_capacity',
          label: 'حداکثر ظرفیت پذیرش اقامتگاه',
        },
      });
      const renamedTrAttrData = extractEntity(renameTrAttrRes);

      recordTest(
        'Phase 4',
        '4.9: Rename Temporary Rent Attribute Technical Key (UUID invariant)',
        renameTrAttrRes.status === 200 && renamedTrAttrData?.id === capacityAttrId && renamedTrAttrData?.key === 'max_capacity',
        { status: renameTrAttrRes.status, id: renamedTrAttrData?.id, expectedId: capacityAttrId, newKey: renamedTrAttrData?.key },
      );

      // 4.10: Verify Temp Rent Subcategory Config reflects renamed attribute key
      const updatedTrConfigRes = await request(`${API_BASE}/temporary-rent/subcategories/${trSubcatId}/config`);
      const updatedTrConfigData = updatedTrConfigRes.data?.data || updatedTrConfigRes.data;
      const updatedTrAttrDefs = updatedTrConfigData?.attributeDefinitions || updatedTrConfigData?.attributes || [];
      const updatedTrAttr = updatedTrAttrDefs.find((a) => a.id === capacityAttrId);

      recordTest(
        'Phase 4',
        '4.10: Verify Temporary Rent Subcategory Config has renamed attribute key',
        updatedTrConfigRes.status === 200 && updatedTrAttr?.key === 'max_capacity' && updatedTrAttr?.id === capacityAttrId,
        { status: updatedTrConfigRes.status, attrKey: updatedTrAttr?.key, attrId: updatedTrAttr?.id },
      );

      // 4.11: Read Temp Rent Ad and verify JSONB attributes were automatically migrated
      const getTrAdAfterAttrRename = await request(`${API_BASE}/temporary-rent/${trAdId}`, {
        headers: normalUser.headers,
      });
      const trAdAfterAttrData = extractEntity(getTrAdAfterAttrRename, 'ad');
      const trAdAttrs = trAdAfterAttrData?.attributes || {};

      const isTrAttrMigrated = trAdAttrs.max_capacity === 4 && trAdAttrs.capacity === undefined;

      recordTest(
        'Phase 4',
        '4.11: Verify Temporary Rent Ad JSONB attributes cascaded (old key removed, new key populated)',
        getTrAdAfterAttrRename.status === 200 && isTrAttrMigrated,
        {
          status: getTrAdAfterAttrRename.status,
          max_capacity: trAdAttrs.max_capacity,
          capacity: trAdAttrs.capacity,
          attributes: trAdAttrs,
        },
      );

      // 4.12: Reject invalid attribute key format on Temp Rent
      const invalidTrAttrKeyAttempt = await request(`${API_BASE}/temporary-rent/subcategories/${trSubcatId}/attributes/${capacityAttrId}`, {
        method: 'PATCH',
        headers: superAdmin.headers,
        body: {
          key: 'INVALID KEY!',
        },
      });

      recordTest(
        'Phase 4',
        '4.12: Reject invalid temporary rent attribute key format (Regex validation 400)',
        invalidTrAttrKeyAttempt.status === 400,
        { status: invalidTrAttrKeyAttempt.status, data: invalidTrAttrKeyAttempt.data },
      );
    }

    // ─────────────────────────────────────────────────────────────────
    // Phase 5: Search & Filter Verification
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 5: Search & Filter Verification ---');
    const searchAdsRes = await request(`${API_BASE}/ads?categoryKey=${updatedCatKey}&subcategoryKey=${cascadedSubcatKey}`);
    const searchAdsData = searchAdsRes.data?.items || searchAdsRes.data?.data?.items || searchAdsRes.data?.data || [];
    const foundAd = searchAdsData.find((item) => item.adId === adId || item.id === adId);

    recordTest(
      'Phase 5',
      '5.1: Search Ads by newly cascaded category & subcategory keys',
      searchAdsRes.status === 200,
      { status: searchAdsRes.status, totalFound: searchAdsData.length, matchedOurAd: !!foundAd },
    );

    const listTrRes = await request(`${API_BASE}/temporary-rent?limit=5`);
    recordTest(
      'Phase 5',
      '5.2: Query Temporary Rent Listings',
      listTrRes.status === 200,
      { status: listTrRes.status },
    );

  } catch (err) {
    console.error('Fatal execution error:', err);
    recordTest('FATAL', 'Execution Exception', false, { error: err.message, stack: err.stack });
  } finally {
    // ─────────────────────────────────────────────────────────────────
    // Phase 6: Safe Teardown & Environment Hygiene
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 6: Safe Teardown & Cleanup ---');
    const cleanupAdmin = superAdmin || (await loginUser('09123456786'));
    const cleanupUser = normalUser || (await loginUser('09123456783'));

    // Clean test ads
    for (const adId of cleanup.adIds) {
      try {
        const delRes = await request(`${API_BASE}/ads/${adId}`, {
          method: 'DELETE',
          headers: cleanupAdmin.headers,
        });
        console.log(`  Cleaned test Ad: ${adId} (Status: ${delRes.status})`);
      } catch (e) {
        console.warn(`  Failed to delete test Ad ${adId}: ${e.message}`);
      }
    }

    // Clean test temporary rent ads (deleted by owner)
    for (const trAdId of cleanup.tempRentAdIds) {
      try {
        const delRes = await request(`${API_BASE}/temporary-rent/${trAdId}`, {
          method: 'DELETE',
          headers: cleanupUser.headers,
        });
        console.log(`  Cleaned test Temporary Rent Ad: ${trAdId} (Status: ${delRes.status})`);
      } catch (e) {
        console.warn(`  Failed to delete test Temporary Rent Ad ${trAdId}: ${e.message}`);
      }
    }

    // Clean uploaded test media
    for (const mediaId of cleanup.mediaIds) {
      try {
        const delRes = await request(`${API_BASE}/media/${mediaId}`, {
          method: 'DELETE',
          headers: cleanupUser.headers,
        });
        console.log(`  Cleaned test Media: ${mediaId} (Status: ${delRes.status})`);
      } catch (e) {
        console.warn(`  Failed to delete test Media ${mediaId}: ${e.message}`);
      }
    }

    // Force delete test subcategories & categories
    for (const catId of cleanup.adsCategoryIds) {
      try {
        const delRes = await request(`${API_BASE}/ads/categories/${catId}/force`, {
          method: 'DELETE',
          headers: cleanupAdmin.headers,
        });
        console.log(`  Force deleted test Ads Category: ${catId} (Status: ${delRes.status})`);
      } catch (e) {
        console.warn(`  Failed to force delete Ads Category ${catId}: ${e.message}`);
      }
    }

    for (const trCatId of cleanup.tempRentCategoryIds) {
      try {
        const delRes = await request(`${API_BASE}/temporary-rent/categories/${trCatId}`, {
          method: 'DELETE',
          headers: cleanupAdmin.headers,
        });
        console.log(`  Cleaned test Temp Rent Category: ${trCatId} (Status: ${delRes.status})`);
      } catch (e) {
        console.warn(`  Failed to clean Temp Rent Category ${trCatId}: ${e.message}`);
      }
    }
  }

  console.log('\n===============================================================');
  console.log('FINAL LIVE E2E VERIFICATION REPORT SUMMARY');
  console.log('===============================================================');
  console.log(`Total Tests Run : ${report.summary.total}`);
  console.log(`Passed          : ${report.summary.passed}`);
  console.log(`Failed          : ${report.summary.failed}`);
  console.log(`Success Rate    : ${Math.round((report.summary.passed / report.summary.total) * 100)}%`);
  console.log('===============================================================\n');

  if (report.summary.failed > 0) {
    process.exit(1);
  }
}

runLiveE2ETestSuite();
