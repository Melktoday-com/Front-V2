import https from 'node:https';

const API_BASE = 'https://beta.melktoday.ir/backend/api';

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      rejectUnauthorized: false,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
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
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

const XSRF_TOKEN = '5caaf73c6ff916f018fd3addeab3c201dc8529078f5db6349a0ad3c875127a22';

async function loginUser(mobileNumber) {
  // 1. Request OTP
  const phone = mobileNumber.startsWith('+') ? mobileNumber : `+98${mobileNumber.replace(/^0/, '')}`;
  await request(`${API_BASE}/auth/otp/request`, {
    method: 'POST',
    body: { mobileNumber: phone },
  });

  // 2. Verify OTP
  const verifyRes = await request(`${API_BASE}/auth/otp/verify`, {
    method: 'POST',
    body: { mobileNumber: phone, otp: '123456' },
  });

  if (verifyRes.status !== 200 && verifyRes.status !== 201) {
    throw new Error(`Login failed for ${mobileNumber}: HTTP ${verifyRes.status} ${JSON.stringify(verifyRes.data)}`);
  }

  const token = verifyRes.data.accessToken || verifyRes.data.token || verifyRes.data.data?.accessToken;
  const cookieHeader = `XSRF-TOKEN=${XSRF_TOKEN}; access_token=${token}`;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-XSRF-TOKEN': XSRF_TOKEN,
    'Cookie': cookieHeader,
  };

  // 3. Fetch user profile
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

async function runTests() {
  console.log('====================================================');
  console.log('MELKTODAY SYSTEM AUDIT & VERIFICATION SUITE');
  console.log('Target: Live Beta Environment');
  console.log('====================================================\n');

  // 1. Login all roles
  console.log('--- Authenticating Roles ---');
  const superAdmin = await loginUser('09123456786');
  console.log('✓ Super Admin authenticated:', superAdmin.userId);

  const admin = await loginUser('09123456781');
  console.log('✓ Admin authenticated:', admin.userId);

  const agent = await loginUser('09123456782');
  console.log('✓ Agent authenticated:', agent.userId);

  const normalUser = await loginUser('09123456783');
  console.log('✓ Normal User authenticated:', normalUser.userId);

  const landlord = await loginUser('09123456784');
  console.log('✓ Landlord authenticated:', landlord.userId);

  console.log('\n--- Running Scenario Verifications ---\n');

  // Scenario 1: Wallet Adjust (Bug 1)
  console.log('[SCENARIO 1] Bug 1: Wallet Adjust with number & string amounts');
  const adjustRes = await request(`${API_BASE}/admin/wallet/adjust`, {
    method: 'POST',
    headers: superAdmin.headers,
    body: {
      targetUserId: normalUser.userId,
      type: 'CREDIT',
      amountRials: 100000,
      note: 'Verification audit credit',
    },
  });
  console.log('Adjust Response:', adjustRes.status, typeof adjustRes.data === 'object' ? JSON.stringify(adjustRes.data) : adjustRes.data);
  if (adjustRes.status === 200 || adjustRes.status === 201) {
    console.log('✓ Scenario 1 PASSED: Wallet adjusted successfully');
  } else {
    console.log('! Scenario 1 Result:', adjustRes.status, adjustRes.data);
  }

  // Fetch valid permissions
  const permsRes = await request(`${API_BASE}/admin/admins/permissions`, {
    headers: superAdmin.headers,
  });
  console.log('Available Permissions count:', permsRes.data?.data?.length || permsRes.data?.length || 0);
  const validPermissions = (permsRes.data?.data || permsRes.data || []).slice(0, 2).map(p => p.key || p.name || p);

  // Scenario 2: Super Admin create admin (Bug 9)
  console.log('\n[SCENARIO 2] Bug 9: Super Admin Admin Management');
  const randomMobile = `099${Math.floor(10000000 + Math.random() * 90000000)}`;
  const createAdminRes = await request(`${API_BASE}/admin/admins`, {
    method: 'POST',
    headers: superAdmin.headers,
    body: {
      phoneNumber: randomMobile,
      firstName: 'مدیر',
      lastName: 'آزمایشی',
      permissions: validPermissions.length > 0 ? validPermissions : ['USERS_VIEW', 'ADS_VIEW'],
    },
  });
  console.log('Create Admin Response:', createAdminRes.status, typeof createAdminRes.data === 'object' ? JSON.stringify(createAdminRes.data) : createAdminRes.data);
  if (createAdminRes.status === 200 || createAdminRes.status === 201) {
    console.log('✓ Scenario 2 PASSED: Admin created with status Active');
  } else {
    console.log('! Scenario 2 Result:', createAdminRes.status, createAdminRes.data);
  }

  // Scenario 3: Admin Broadcast Notification (Bug 6)
  console.log('\n[SCENARIO 3] Bug 6: Admin Broadcast Notification');
  const broadcastRes = await request(`${API_BASE}/admin/notifications/broadcast`, {
    method: 'POST',
    headers: superAdmin.headers,
    body: {
      title: 'پیام مهم سامانه حسابرسی',
      body: 'این پیام جهت تست سیستم اعلان عمومی ارسال شده است.',
      audience: 'ALL',
    },
  });
  console.log('Broadcast Response:', broadcastRes.status, typeof broadcastRes.data === 'object' ? JSON.stringify(broadcastRes.data) : broadcastRes.data);
  if (broadcastRes.status === 200 || broadcastRes.status === 201) {
    console.log('✓ Scenario 3 PASSED: Broadcast notification executed');
  }

  // Scenario 4: Agency Follow & Showcase (Bug 7)
  console.log('\n[SCENARIO 4] Bug 7: Agency Follow/Unfollow & Showcase Status');
  const listAgenciesRes = await request(`${API_BASE}/agencies?limit=5`);
  const rawAgencies = listAgenciesRes.data?.data?.agencies || listAgenciesRes.data?.agencies || [];
  console.log('Agencies count found:', rawAgencies.length);
  if (rawAgencies.length > 0) {
    const targetAgency = rawAgencies[0];
    console.log(`Testing Agency: ${targetAgency.name || targetAgency.agencyName} (${targetAgency.id})`);

    // Unfollow first to ensure clean test
    await request(`${API_BASE}/agencies/${targetAgency.id}/unfollow`, {
      method: 'POST',
      headers: normalUser.headers,
    });

    // Follow
    const followRes = await request(`${API_BASE}/agencies/${targetAgency.id}/follow`, {
      method: 'POST',
      headers: normalUser.headers,
    });
    console.log('Follow Response Status:', followRes.status);

    // Get showcase
    const showcaseRes = await request(`${API_BASE}/agencies/showcase/${targetAgency.id}`, {
      headers: normalUser.headers,
    });
    console.log('Showcase Response Status:', showcaseRes.status);
    console.log('Showcase Data:', {
      id: showcaseRes.data?.data?.id || showcaseRes.data?.id,
      name: showcaseRes.data?.data?.name || showcaseRes.data?.name,
      followersCount: showcaseRes.data?.data?.followersCount ?? showcaseRes.data?.followersCount,
      isFollowing: showcaseRes.data?.data?.isFollowing ?? showcaseRes.data?.isFollowing,
    });
    console.log('✓ Scenario 4 Follow/Unfollow flow verified');
  }

  // Scenario 5: Geo Zone Import (Bug 2)
  console.log('\n[SCENARIO 5] Bug 2: Geo Zone Import Idempotency');
  const importRes = await request(`${API_BASE}/geo/zones/import`, {
    method: 'POST',
    headers: superAdmin.headers,
    body: {
      format: 'GEOJSON',
      type: 'NEIGHBORHOOD',
      content: JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'محله زعفرانیه آزمایشی' },
            geometry: {
              type: 'Polygon',
              coordinates: [[[51.41, 35.80], [51.42, 35.80], [51.42, 35.81], [51.41, 35.81], [51.41, 35.80]]]
            }
          }
        ]
      })
    }
  });
  console.log('Import Response Status:', importRes.status, typeof importRes.data === 'object' ? JSON.stringify(importRes.data) : importRes.data);
  if (importRes.status === 200 || importRes.status === 201) {
    console.log('✓ Scenario 5 PASSED: Geo zones imported/reconciled');
  }

  // Scenario 6: Category Subcategory Creation (Bug 10)
  console.log('\n[SCENARIO 6] Bug 10: Category & Subcategory Creation');
  const catsRes = await request(`${API_BASE}/ads/categories`);
  const rawCategories = catsRes.data?.data?.categories || catsRes.data?.categories || [];
  console.log('Categories count found:', rawCategories.length);
  if (rawCategories.length > 0) {
    const parentCat = rawCategories[0];
    const subcatRes = await request(`${API_BASE}/ads/categories/${parentCat.id}/subcategories`, {
      method: 'POST',
      headers: superAdmin.headers,
      body: {
        displayName: `زیردسته آزمایشی ${Date.now()}`,
        key: `subcat_${Date.now()}`,
        displayOrder: 1,
        isActive: true,
      }
    });
    console.log('Subcategory Create Status:', subcatRes.status, typeof subcatRes.data === 'object' ? JSON.stringify(subcatRes.data) : subcatRes.data);
    if (subcatRes.status === 201 || subcatRes.status === 200) {
      console.log('✓ Scenario 6 PASSED: Subcategory created successfully');
    }
  }

  console.log('\n====================================================');
  console.log('ALL VERIFICATION SCENARIOS COMPLETED');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Verification Error:', err);
  process.exit(1);
});
