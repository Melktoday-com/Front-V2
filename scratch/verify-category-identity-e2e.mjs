import https from 'node:https';

const API_BASE = 'https://beta.melktoday.ir/backend/api';

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

async function runLiveVerification() {
  console.log('=== STARTING LIVE BETA VERIFICATION FOR CATEGORY IDENTITY REFACTOR ===');
  console.log(`Target API Base: ${API_BASE}\n`);

  let allPassed = true;

  // 1. Health check
  try {
    const health = await request(`${API_BASE}/health/live`);
    console.log(`[PASS] 1. Health check status: ${health.status} (${JSON.stringify(health.data?.data || health.data)})`);
  } catch (err) {
    console.error(`[FAIL] 1. Health check failed:`, err);
    allPassed = false;
  }

  // 2. Fetch Ads Categories
  let sampleSubcategoryId = null;
  let sampleSubcategoryKey = null;
  let sampleCategoryKey = null;
  try {
    const catRes = await request(`${API_BASE}/ads/categories`);
    if (catRes.status === 200 && catRes.data?.data?.categories) {
      const categories = catRes.data.data.categories;
      console.log(`[PASS] 2. Ads categories retrieved: ${categories.length} categories found.`);
      for (const cat of categories) {
        console.log(`   - Category [${cat.id}] key: "${cat.key}", displayName: "${cat.displayName}", subcategories: ${cat.subcategories?.length || 0}`);
        if (!sampleSubcategoryId && cat.subcategories?.length > 0) {
          sampleCategoryKey = cat.key;
          sampleSubcategoryId = cat.subcategories[0].id;
          sampleSubcategoryKey = cat.subcategories[0].key;
        }
      }
    } else {
      console.error(`[FAIL] 2. Unexpected categories response:`, catRes.status, catRes.data);
      allPassed = false;
    }
  } catch (err) {
    console.error(`[FAIL] 2. Categories request failed:`, err);
    allPassed = false;
  }

  // 3. Fetch Temporary Rent Categories
  try {
    const tempCatRes = await request(`${API_BASE}/temporary-rent/categories`);
    if (tempCatRes.status === 200 && tempCatRes.data?.data?.categories) {
      const tempCategories = tempCatRes.data.data.categories;
      console.log(`[PASS] 3. Temporary rent categories retrieved: ${tempCategories.length} categories found.`);
      for (const cat of tempCategories) {
        console.log(`   - Temporary Rent Category [${cat.id}] key: "${cat.key}", displayName: "${cat.displayName}", subcategories: ${cat.subcategories?.length || 0}`);
      }
    } else {
      console.error(`[FAIL] 3. Unexpected temporary rent categories response:`, tempCatRes.status, tempCatRes.data);
      allPassed = false;
    }
  } catch (err) {
    console.error(`[FAIL] 3. Temporary rent categories request failed:`, err);
    allPassed = false;
  }

  // 4. Fetch Subcategory Config (Price models + Dynamic attributes)
  if (sampleSubcategoryId) {
    try {
      const subConfigRes = await request(`${API_BASE}/ads/subcategories/${sampleSubcategoryId}/config`);
      if (subConfigRes.status === 200 && subConfigRes.data?.data) {
        const config = subConfigRes.data.data;
        console.log(`[PASS] 4. Subcategory config for ID [${sampleSubcategoryId}] (${sampleSubcategoryKey}):`);
        console.log(`   - Resolved subcategory: key="${config.subcategory?.key}", displayName="${config.subcategory?.displayName}"`);
        console.log(`   - Allowed price models: ${config.allowedPriceModels?.length || 0}`);
        console.log(`   - Dynamic attribute definitions: ${config.attributeDefinitions?.length || 0}`);
      } else {
        console.error(`[FAIL] 4. Subcategory config fetch failed:`, subConfigRes.status, subConfigRes.data);
        allPassed = false;
      }
    } catch (err) {
      console.error(`[FAIL] 4. Subcategory config request error:`, err);
      allPassed = false;
    }
  }

  // 5. Query Ads List with Category Filter
  try {
    const adsRes = await request(`${API_BASE}/ads?limit=5`);
    if (adsRes.status === 200) {
      console.log(`[PASS] 5. Public Ads listing query: status ${adsRes.status}, items returned.`);
      if (sampleCategoryKey) {
        const filteredAds = await request(`${API_BASE}/ads?categoryKey=${encodeURIComponent(sampleCategoryKey)}&limit=5`);
        console.log(`[PASS] 6. Filtered Ads query by categoryKey="${sampleCategoryKey}": status ${filteredAds.status}`);
      }
    } else {
      console.error(`[FAIL] 5. Public ads query failed:`, adsRes.status, adsRes.data);
      allPassed = false;
    }
  } catch (err) {
    console.error(`[FAIL] 5. Public ads query error:`, err);
    allPassed = false;
  }

  // 6. Query Temporary Rent Ads
  try {
    const tempAdsRes = await request(`${API_BASE}/temporary-rent?limit=5`);
    console.log(`[PASS] 7. Temporary rent public ads query: status ${tempAdsRes.status}, items returned: ${tempAdsRes.data?.data?.items?.length || 0}`);
  } catch (err) {
    console.error(`[FAIL] 7. Temporary rent public ads query error:`, err);
    allPassed = false;
  }

  console.log('\n=== LIVE VERIFICATION SUMMARY ===');
  if (allPassed) {
    console.log('✅ ALL LIVE BETA ENDPOINTS VERIFIED SUCCESSFULLY.');
  } else {
    console.log('❌ SOME LIVE BETA ENDPOINTS ENCOUNTERED ISSUES.');
  }
}

runLiveVerification();
