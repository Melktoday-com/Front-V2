import https from 'node:https';

const API_BASE = 'https://beta.melktoday.ir/backend/api';

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
        port: parsed.port || 443,
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

async function getXsrfToken() {
  const res = await request(`${API_BASE}/health`);
  const setCookie = res.headers['set-cookie'] || [];
  for (const c of setCookie) {
    const match = c.match(/XSRF-TOKEN=([^;]+)/);
    if (match) return match[1];
  }
  return 'default-xsrf-token';
}

async function uploadImage(token, xsrfToken, fileName = 'live-test.png') {
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  const boundary = '----WebKitFormBoundaryLiveTest' + Date.now();
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
          'X-XSRF-TOKEN': xsrfToken,
          Cookie: `XSRF-TOKEN=${xsrfToken}; access_token=${token}`,
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

async function loginUser(mobileNumber, xsrfToken) {
  const phone = mobileNumber.startsWith('+')
    ? mobileNumber
    : `+98${mobileNumber.replace(/^0/, '')}`;

  await request(`${API_BASE}/auth/otp/request`, {
    method: 'POST',
    headers: {
      'X-XSRF-TOKEN': xsrfToken,
      Cookie: `XSRF-TOKEN=${xsrfToken}`,
    },
    body: { mobileNumber: phone },
  });

  const verifyRes = await request(`${API_BASE}/auth/otp/verify`, {
    method: 'POST',
    headers: {
      'X-XSRF-TOKEN': xsrfToken,
      Cookie: `XSRF-TOKEN=${xsrfToken}`,
    },
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
    verifyRes.data?.data?.accessToken ||
    verifyRes.data?.accessToken ||
    verifyRes.data?.token;

  const cookieHeader = `XSRF-TOKEN=${xsrfToken}; access_token=${token}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    'X-XSRF-TOKEN': xsrfToken,
    Cookie: cookieHeader,
  };

  const meRes = await request(`${API_BASE}/users/me`, { headers });
  const user = meRes.data?.data || meRes.data;

  return {
    phone,
    token,
    user,
    userId: user?.id || user?.userId,
    headers,
  };
}

const results = [];
function test(name, passed, details = {}) {
  results.push({ name, passed, details });
  if (passed) {
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}`, JSON.stringify(details));
  }
}

async function run() {
  console.log('===============================================================');
  console.log('MELKTODAY LIVE BACKEND VERIFICATION');
  console.log(`Endpoint: ${API_BASE}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('===============================================================\n');

  // 1. Health check
  console.log('--- 1. Health Checks ---');
  const healthRes = await request(`${API_BASE}/health`);
  test('GET /health returns 200 and healthy status', healthRes.status === 200 && healthRes.data?.data?.status === 'healthy', {
    status: healthRes.status,
    data: healthRes.data,
  });

  const xsrfToken = await getXsrfToken();
  console.log(`  Acquired XSRF token: ${xsrfToken.slice(0, 16)}...`);

  // 2. Authentication
  console.log('\n--- 2. Role Authentication ---');
  const superAdmin = await loginUser('09123456786', xsrfToken);
  test('SuperAdmin Login (+989123456786)', !!superAdmin.token && !!superAdmin.userId, {
    userId: superAdmin.userId,
  });

  const admin = await loginUser('09123456781', xsrfToken);
  test('Admin Login (+989123456781)', !!admin.token && !!admin.userId, {
    userId: admin.userId,
  });

  const user = await loginUser('09123456783', xsrfToken);
  test('Normal User Login (+989123456783)', !!user.token && !!user.userId, {
    userId: user.userId,
  });

  // 3. Media Upload
  console.log('\n--- 3. Media Upload ---');
  const ts = Date.now();
  const uploadRes = await uploadImage(user.token, xsrfToken, `test-${ts}.png`);
  const mediaData = uploadRes.data?.data || uploadRes.data;
  const mediaId = mediaData?.id || mediaData?.mediaId;
  test('Upload Image returns 201 and UUID mediaId', (uploadRes.status === 200 || uploadRes.status === 201) && !!mediaId, {
    status: uploadRes.status,
    mediaId,
  });

  // 4. Strict Media Architecture Contract Verification (Negative Tests)
  console.log('\n--- 4. Strict Media Architecture Rejections (Negative Tests) ---');

  // 4a. Post with legacy string array must be rejected with 400 or 422 validation error
  const legacyPostRes = await request(`${API_BASE}/posts`, {
    method: 'POST',
    headers: superAdmin.headers,
    body: {
      publisherType: 'PLATFORM',
      publisherId: 'melktoday-official',
      title: `Legacy String Array Post ${ts}`,
      content: 'This must be rejected by strict DTO validation',
      category: 'معرفی ملک ویژه',
      mediaIds: [mediaId], // RAW STRING ARRAY - INVALID!
    },
  });
  const isPostLegacyRejected = (legacyPostRes.status === 400 || legacyPostRes.status === 422) &&
    JSON.stringify(legacyPostRes.data).includes('mediaIds');
  test('POST /posts with raw string[] mediaIds is REJECTED (4xx Validation Error)', isPostLegacyRejected, {
    status: legacyPostRes.status,
    response: legacyPostRes.data,
  });

  // 4b. Post with invalid type must be rejected with 400 or 422
  const invalidTypePostRes = await request(`${API_BASE}/posts`, {
    method: 'POST',
    headers: superAdmin.headers,
    body: {
      publisherType: 'PLATFORM',
      publisherId: 'melktoday-official',
      title: `Invalid Media Type Post ${ts}`,
      content: 'This must be rejected because type is not IMAGE or VIDEO',
      category: 'معرفی ملک ویژه',
      mediaIds: [{ id: mediaId, type: 'AUDIO' }], // INVALID TYPE!
    },
  });
  const isInvalidTypeRejected = (invalidTypePostRes.status === 400 || invalidTypePostRes.status === 422) &&
    JSON.stringify(invalidTypePostRes.data).includes('isEnum');
  test('POST /posts with invalid MediaType is REJECTED (4xx isEnum error)', isInvalidTypeRejected, {
    status: invalidTypePostRes.status,
    response: invalidTypePostRes.data,
  });

  // 4c. Ads Draft with raw string array must be rejected
  const citiesRes = await request(`${API_BASE}/geo/cities?limit=1`);
  const cityId = citiesRes.data?.data?.items?.[0]?.id || citiesRes.data?.items?.[0]?.id || '8a85e61c-f906-4283-8d20-add8143413c7';

  const legacyAdRes = await request(`${API_BASE}/ads/drafts`, {
    method: 'POST',
    headers: user.headers,
    body: {
      cityId,
      title: `Legacy Ad Draft ${ts}`,
      description: 'Legacy ad with raw string mediaIds',
      categoryPath: {
        categoryKey: 'residential_sale',
        subcategoryKey: 'apartment_sale',
        businessModelKey: 'CASH_FREEHOLD_SALE',
        attributeSchemaVersion: 1,
      },
      rawPricing: { totalPrice: 1000000000 },
      mediaIds: [mediaId], // RAW STRING ARRAY - INVALID!
      attributes: { floor_count: 2 },
      latitude: 35.7,
      longitude: 51.3,
    },
  });
  const isAdLegacyRejected = (legacyAdRes.status === 400 || legacyAdRes.status === 422) &&
    JSON.stringify(legacyAdRes.data).includes('mediaIds');
  test('POST /ads/drafts with raw string[] mediaIds is REJECTED (4xx Validation Error)', isAdLegacyRejected, {
    status: legacyAdRes.status,
    response: legacyAdRes.data,
  });

  // 4d. Temporary Rent with raw string array must be rejected
  const legacyTrRes = await request(`${API_BASE}/temporary-rent/drafts`, {
    method: 'POST',
    headers: user.headers,
    body: {
      cityId,
      title: `Legacy TR Draft ${ts}`,
      description: 'Legacy tr with raw string mediaIds',
      categoryPath: {
        categoryKey: 'villas',
        subcategoryKey: 'beach_villa',
        attributeSchemaVersion: 1,
      },
      priceModelKey: 'DAILY_RENT_STANDARD',
      nightlyPrice: 2000000,
      maxGuests: 4,
      availabilityWindow: {
        availableFrom: '2026-10-05T00:00:00.000Z',
        availableTo: '2026-10-15T00:00:00.000Z',
      },
      latitude: 36.6,
      longitude: 51.4,
      mediaIds: [mediaId], // RAW STRING ARRAY - INVALID!
    },
  });
  const isTrLegacyRejected = (legacyTrRes.status === 400 || legacyTrRes.status === 422) &&
    JSON.stringify(legacyTrRes.data).includes('mediaIds');
  test('POST /temporary-rent/drafts with raw string[] mediaIds is REJECTED (4xx Validation Error)', isTrLegacyRejected, {
    status: legacyTrRes.status,
    response: legacyTrRes.data,
  });

  // 5. Strict Media Architecture Positive Tests
  console.log('\n--- 5. Strict Media Architecture Positive Tests ---');

  // 5a. Create Canonical Post
  const validPostRes = await request(`${API_BASE}/posts`, {
    method: 'POST',
    headers: superAdmin.headers,
    body: {
      publisherType: 'PLATFORM',
      publisherId: 'melktoday-official',
      title: `پست آزمون زنده ساختار مدیا ${ts}`,
      content: 'توضیحات پست آزمون زنده با مدیا رفرنس ساختارمند کانونی',
      category: 'معرفی ملک ویژه',
      mediaIds: [{ id: mediaId, type: 'IMAGE' }], // CANONICAL OBJECT SHAPE!
      isPublished: true,
      isFeatured: false,
    },
  });
  const createdPost = validPostRes.data?.data || validPostRes.data;
  const postId = createdPost?.id;
  const postSlug = createdPost?.slug;
  test('POST /posts with canonical MediaReference[] creates post (201)', (validPostRes.status === 201 || validPostRes.status === 200) && !!postId, {
    status: validPostRes.status,
    postId,
    slug: postSlug,
  });

  // 5b. Retrieve Post and Assert Canonical Structure
  if (postId) {
    const getPostRes = await request(`${API_BASE}/posts/${postId}`);
    const fetchedPost = getPostRes.data?.data || getPostRes.data;
    const postMediaIds = fetchedPost?.mediaIds;
    const hasMediaUrls = 'mediaUrls' in fetchedPost;

    const isCanonicalMedia = Array.isArray(postMediaIds) &&
      postMediaIds.length === 1 &&
      postMediaIds[0].id === mediaId &&
      postMediaIds[0].type === 'IMAGE';

    test('GET /posts/:id returns canonical MediaReference[] and NO mediaUrls', getPostRes.status === 200 && isCanonicalMedia && !hasMediaUrls, {
      status: getPostRes.status,
      mediaIds: postMediaIds,
      hasMediaUrls,
    });
  }

  // 5c. Create Canonical Ad Draft
  const validAdRes = await request(`${API_BASE}/ads/drafts`, {
    method: 'POST',
    headers: user.headers,
    body: {
      cityId,
      title: `آگهی آزمایشی با مدیا رفرنس کانونی ${ts}`,
      description: 'آگهی برای تست مدیا رفرنس آبجکتی بدون فال‌بک',
      categoryPath: {
        categoryKey: 'residential_sale',
        subcategoryKey: 'apartment_sale',
        businessModelKey: 'CASH_FREEHOLD_SALE',
        attributeSchemaVersion: 1,
      },
      rawPricing: { totalPrice: 5500000000 },
      mediaIds: [{ id: mediaId, type: 'IMAGE' }], // CANONICAL OBJECT SHAPE!
      attributes: { floor_count: 3 },
      latitude: 35.7,
      longitude: 51.3,
    },
  });
  const createdAd = validAdRes.data?.data || validAdRes.data;
  const adId = createdAd?.id || createdAd?.adId;
  test('POST /ads/drafts with canonical MediaReference[] creates ad (201)', validAdRes.status === 201 && !!adId, {
    status: validAdRes.status,
    adId,
  });

  // 5d. Retrieve Ad and Assert Canonical Structure
  if (adId) {
    const getAdRes = await request(`${API_BASE}/ads/${adId}`, {
      headers: user.headers,
    });
    const fetchedAd = getAdRes.data?.data || getAdRes.data;
    const adMediaIds = fetchedAd?.mediaIds;
    const hasMediaUrls = 'mediaUrls' in fetchedAd;

    const isCanonicalMedia = Array.isArray(adMediaIds) &&
      adMediaIds.length === 1 &&
      adMediaIds[0].id === mediaId &&
      adMediaIds[0].type === 'IMAGE';

    test('GET /ads/:id returns canonical MediaReference[] and NO mediaUrls', getAdRes.status === 200 && isCanonicalMedia && !hasMediaUrls, {
      status: getAdRes.status,
      mediaIds: adMediaIds,
      hasMediaUrls,
    });
  }

  // 5e. Create Canonical Temporary Rent Draft
  const validTrRes = await request(`${API_BASE}/temporary-rent/drafts`, {
    method: 'POST',
    headers: user.headers,
    body: {
      cityId,
      title: `اجاره موقت با مدیا رفرنس کانونی ${ts}`,
      description: 'تست اجاره موقت با ساختار جدید مدیا',
      categoryPath: {
        categoryKey: 'villas',
        subcategoryKey: 'beach_villa',
        attributeSchemaVersion: 1,
      },
      priceModelKey: 'DAILY_RENT_STANDARD',
      nightlyPrice: 3000000,
      maxGuests: 4,
      availabilityWindow: {
        availableFrom: '2026-10-05T00:00:00.000Z',
        availableTo: '2026-10-15T00:00:00.000Z',
      },
      latitude: 36.6,
      longitude: 51.4,
      mediaIds: [{ id: mediaId, type: 'IMAGE' }], // CANONICAL OBJECT SHAPE!
    },
  });
  const createdTr = validTrRes.data?.data || validTrRes.data;
  const trId = createdTr?.id || createdTr?.adId;
  test('POST /temporary-rent/drafts with canonical MediaReference[] creates tr draft (201)', validTrRes.status === 201 && !!trId, {
    status: validTrRes.status,
    trId,
    error: validTrRes.status !== 201 ? validTrRes.data : undefined,
  });

  // 5f. Retrieve Temporary Rent and Assert Canonical Structure
  if (trId) {
    const getTrRes = await request(`${API_BASE}/temporary-rent/${trId}`, {
      headers: user.headers,
    });
    const fetchedTr = getTrRes.data?.data || getTrRes.data;
    const trMediaIds = fetchedTr?.mediaIds;
    const hasMediaUrls = 'mediaUrls' in fetchedTr;

    const isCanonicalMedia = Array.isArray(trMediaIds) &&
      trMediaIds.length === 1 &&
      trMediaIds[0].id === mediaId &&
      trMediaIds[0].type === 'IMAGE';

    test('GET /temporary-rent/:id returns canonical MediaReference[] and NO mediaUrls', getTrRes.status === 200 && isCanonicalMedia && !hasMediaUrls, {
      status: getTrRes.status,
      mediaIds: trMediaIds,
      hasMediaUrls,
    });
  }

  // 6. Explore and Public Feed Integration
  console.log('\n--- 6. Explore & Public Posts Feed ---');
  const exploreRes = await request(`${API_BASE}/posts?page=1&limit=10`);
  const explorePosts = exploreRes.data?.data?.items || exploreRes.data?.items || [];
  test('GET /posts returns 200 and list of posts', exploreRes.status === 200 && Array.isArray(explorePosts), {
    status: exploreRes.status,
    count: explorePosts.length,
  });

  // Check that all explore posts adhere to strict MediaReference shape (no strings)
  let allPostsAdhere = true;
  for (const p of explorePosts) {
    if (p.mediaIds && Array.isArray(p.mediaIds)) {
      for (const m of p.mediaIds) {
        if (typeof m !== 'object' || !m.id || !m.type) {
          allPostsAdhere = false;
          break;
        }
      }
    }
    if ('mediaUrls' in p) {
      allPostsAdhere = false;
      break;
    }
  }
  test('All explore posts strictly use MediaReference[] (no string arrays, no mediaUrls)', allPostsAdhere, {
    totalChecked: explorePosts.length,
    samplePostMedia: explorePosts[0]?.mediaIds,
  });

  console.log('\n===============================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log('===============================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
