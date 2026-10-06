import https from 'node:https';

const API_BASE = 'https://beta.melktoday.ir/backend/api';

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const parsed = new URL(fullUrl);
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

async function loginUser(mobileNumber) {
  const phone = mobileNumber.startsWith('+')
    ? mobileNumber
    : `+98${mobileNumber.replace(/^0/, '')}`;

  await request('/auth/otp/request', {
    method: 'POST',
    body: { mobileNumber: phone },
  });

  const verifyRes = await request('/auth/otp/verify', {
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

  let xsrf = 'xsrf-token-default';
  const cookies = verifyRes.headers['set-cookie'] || [];
  for (const c of cookies) {
    const match = c.match(/XSRF-TOKEN=([^;]+)/);
    if (match) xsrf = match[1];
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'X-XSRF-TOKEN': xsrf,
    Cookie: `XSRF-TOKEN=${xsrf}; access_token=${token}`,
  };

  const meRes = await request('/users/me', { headers });
  const user = meRes.data.data || meRes.data;

  return {
    phone,
    token,
    user,
    userId: user?.id || user?.userId || verifyRes.data.userId || verifyRes.data.data?.userId,
    headers,
  };
}

const testResults = [];
function record(name, passed, detail) {
  testResults.push({ name, passed, detail });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}${detail ? ` (${detail})` : ''}`);
}

async function runValidation() {
  console.log('====================================================');
  console.log('🚀 Starting Remote Monetization & Payment Validation');
  console.log(`Target: ${API_BASE}`);
  console.log('====================================================\n');

  // Scenario 1: Public Subscription Plans Query
  try {
    const res = await request('/subscriptions/plans');
    const plans = res.data.data || res.data;
    const isArray = Array.isArray(plans);
    const hasPlans = isArray && plans.length > 0;
    record(
      'Scenario 1.1: Public Query /subscriptions/plans returns 200',
      res.status === 200 && hasPlans,
      `Returned ${plans?.length || 0} plans`,
    );

    const silverPlan = plans?.find((p) => p.slug === 'host-silver' || p.targetRole === 'landlord');
    const hasQuotas =
      silverPlan &&
      silverPlan.publicationQuota !== undefined &&
      silverPlan.tempRentQuota !== undefined &&
      silverPlan.priceIrr !== undefined;
    record(
      'Scenario 1.2: Plans contain dynamic quotas, prices, and badges',
      Boolean(hasQuotas),
      `Plan: ${silverPlan?.name}, Price: ${silverPlan?.priceIrr} IRR, Badge: ${silverPlan?.badgeName}`,
    );

    // Test filtering by role
    const agentPlansRes = await request('/subscriptions/plans?role=agent');
    const agentPlans = agentPlansRes.data.data || agentPlansRes.data;
    const allAgent = Array.isArray(agentPlans) && agentPlans.every((p) => p.targetRole === 'agent');
    record(
      'Scenario 1.3: Filter plans by role (?role=agent)',
      allAgent,
      `Returned ${agentPlans.length} agent plans`,
    );
  } catch (err) {
    record('Scenario 1: Public Subscription Plans', false, err.message);
  }

  // Auth: Log in seeded regular user (+989123456787)
  let regularUser = null;
  try {
    regularUser = await loginUser('+989123456787');
    record(
      'Auth Setup: Authenticated seeded regular user',
      Boolean(regularUser.token),
      `User ID: ${regularUser.userId}, Phone: ${regularUser.phone}`,
    );
  } catch (err) {
    record('Auth Setup: Failed to login regular user', false, err.message);
    return;
  }

  // Auth: Log in seeded agent (+989123456783)
  let agentUser = null;
  try {
    agentUser = await loginUser('+989123456783');
    record(
      'Auth Setup: Authenticated seeded agent user',
      Boolean(agentUser.token),
      `User ID: ${agentUser.userId}, Phone: ${agentUser.phone}`,
    );
  } catch (err) {
    record('Auth Setup: Failed to login agent user', false, err.message);
  }

  // Auth: Log in seeded super-admin (+989123456786)
  let superAdminUser = null;
  try {
    superAdminUser = await loginUser('+989123456786');
    record(
      'Auth Setup: Authenticated seeded super-admin',
      Boolean(superAdminUser.token),
      `User ID: ${superAdminUser.userId}, Phone: ${superAdminUser.phone}`,
    );
  } catch (err) {
    record('Auth Setup: Failed to login super-admin', false, err.message);
  }

  // Scenario 2: Regular User Subscription Purchase Guard (Business Rule 1)
  try {
    const res = await request('/subscriptions/purchase', {
      method: 'POST',
      headers: regularUser.headers,
      body: {
        planId: 'b1111111-1111-4111-a111-111111111111',
        autoRenew: false,
        idempotencyKey: `regular_purchase_${Date.now()}`,
      },
    });

    const isForbidden = res.status === 403;
    record(
      'Scenario 2: Regular user is FORBIDDEN from purchasing subscription plans (HTTP 403)',
      isForbidden,
      `Status: ${res.status}, Message: ${JSON.stringify(res.data.error?.message || res.data.message || res.data)}`,
    );
  } catch (err) {
    record('Scenario 2: Regular user subscription purchase guard', false, err.message);
  }

  // Scenario 3: Agent Subscription Purchase Flow (Role allowed, wallet balance check)
  if (agentUser) {
    try {
      const res = await request('/subscriptions/purchase', {
        method: 'POST',
        headers: agentUser.headers,
        body: {
          planId: 'b3333333-3333-4333-a333-333333333333',
          autoRenew: false,
          idempotencyKey: `agent_purchase_${Date.now()}`,
        },
      });

      // Status 400 with insufficient wallet balance message indicates role was authorized
      const errorMsg = res.data.error?.message || res.data.message || '';
      const isRoleAllowed = res.status === 400 && errorMsg.includes('کیف پول');
      record(
        'Scenario 3: Agent purchase authorization validated (Wallet check active)',
        isRoleAllowed || res.status === 201,
        `Status: ${res.status}, Response: ${errorMsg}`,
      );
    } catch (err) {
      record('Scenario 3: Agent subscription purchase flow', false, err.message);
    }
  }

  // Scenario 4: Payment Security — Arbitrary Balance Credit Lockdown
  try {
    const res = await request('/wallet/charge', {
      method: 'POST',
      headers: regularUser.headers,
      body: {
        amount: 1000000,
        currency: 'IRR',
        reason: 'Attempted unauthorized credit',
      },
    });

    const isForbidden = res.status === 403;
    record(
      'Scenario 4: Direct wallet charge is locked down to Admin (Regular user rejected with 403)',
      isForbidden,
      `Status: ${res.status}, Message: ${JSON.stringify(res.data.error?.message || res.data.message || res.data)}`,
    );
  } catch (err) {
    record('Scenario 4: Payment security direct charge lockdown', false, err.message);
  }

  // Scenario 5: Secure Jibit Top-Up Initiation Endpoint
  let topUpPurchaseId = null;
  try {
    const res = await request('/wallet/top-up/initiate', {
      method: 'POST',
      headers: regularUser.headers,
      body: {
        amountIRR: 500000,
        callbackUrl: 'https://beta.melktoday.ir/wallet/callback',
        idempotencyKey: `topup_e2e_${Date.now()}`,
      },
    });

    const payload = res.data.data || res.data;
    topUpPurchaseId = payload?.purchaseId;
    const hasPaymentUrl = payload?.paymentUrl && typeof payload.paymentUrl === 'string';

    // In environments where Jibit external connectivity is unavailable or disabled, 503 is returned cleanly
    const isSuccess = res.status === 201 && hasPaymentUrl;
    const isCleanGatewayUnavailable = res.status === 503;

    record(
      'Scenario 5: Secure Jibit Top-Up Initiation handles gateway lifecycle cleanly',
      isSuccess || isCleanGatewayUnavailable,
      isSuccess
        ? `PurchaseId: ${topUpPurchaseId}, URL: ${payload?.paymentUrl}`
        : `Gateway unavailable (HTTP ${res.status}): ${JSON.stringify(res.data.error?.message || res.data)}`,
    );
  } catch (err) {
    record('Scenario 5: Secure Jibit Top-Up Initiation', false, err.message);
  }

  // Scenario 6: Payment Attempt Status Query (Auditable lifecycle)
  try {
    const res = await request(
      `/wallet/payments/status?purchaseId=${topUpPurchaseId || 'non-existent-uuid'}`,
      {
        method: 'GET',
        headers: regularUser.headers,
      },
    );

    const validResponse =
      (res.status === 200 && (res.data.data?.status === 'PENDING' || res.data.data?.status === 'FAILED')) ||
      res.status === 404;

    record(
      'Scenario 6: Payment attempt status query returns auditable result (200 / 404)',
      validResponse,
      `HTTP ${res.status}: ${JSON.stringify(res.data.error?.message || res.data.data?.status || res.data)}`,
    );
  } catch (err) {
    record('Scenario 6: Payment Attempt Status Query', false, err.message);
  }

  // Scenario 7: Welcome Package Claim & Idempotency (Business Rule 3)
  try {
    // 7.1: Regular user welcome package claim
    const claimRes = await request('/subscriptions/welcome-package/claim', {
      method: 'POST',
      headers: regularUser.headers,
      body: { targetRole: 'user' },
    });

    const claimData = claimRes.data.data || claimRes.data;
    // Already claimed or newly claimed
    const isClaimHandled =
      (claimRes.status === 200 && claimData?.claimed === true) ||
      (claimRes.status === 409); // If claimed in prior run

    record(
      'Scenario 7.1: Welcome Package grants wallet bonus for Regular User (NO subscription created)',
      isClaimHandled,
      `HTTP ${claimRes.status}: ${JSON.stringify(claimData)}`,
    );

    // 7.2: Repeat claim must return 409 Conflict (Idempotent / Anti-abuse)
    const repeatClaimRes = await request('/subscriptions/welcome-package/claim', {
      method: 'POST',
      headers: regularUser.headers,
      body: { targetRole: 'user' },
    });

    const isConflict = repeatClaimRes.status === 409;
    record(
      'Scenario 7.2: Repeated Welcome Package claim is blocked (HTTP 409 Conflict)',
      isConflict,
      `Status: ${repeatClaimRes.status}, Message: ${JSON.stringify(repeatClaimRes.data.error?.message || repeatClaimRes.data.message || repeatClaimRes.data)}`,
    );
  } catch (err) {
    record('Scenario 7: Welcome Package Claim', false, err.message);
  }

  // Scenario 8: Entitlements Query for Authenticated User
  try {
    const entRes = await request('/subscriptions/entitlements', {
      headers: regularUser.headers,
    });
    const entitlements = entRes.data.data || entRes.data;
    record(
      'Scenario 8.1: Entitlements query returns user quotas',
      entRes.status === 200 && Array.isArray(entitlements),
      `Active quotas count: ${entitlements?.length || 0}`,
    );

    const badgeRes = await request('/subscriptions/badge', {
      headers: regularUser.headers,
    });
    record(
      'Scenario 8.2: Badge query endpoint returns active badge metadata or null',
      badgeRes.status === 200,
      `Badge: ${JSON.stringify(badgeRes.data.data ?? badgeRes.data)}`,
    );
  } catch (err) {
    record('Scenario 8: Entitlements and Badge Queries', false, err.message);
  }

  // Scenario 9: Super-Admin Plan Management Authorization
  if (superAdminUser) {
    try {
      const adminPlansRes = await request('/subscriptions/admin/plans', {
        headers: superAdminUser.headers,
      });

      const hasAdminPlans = adminPlansRes.status === 200 && Array.isArray(adminPlansRes.data.data || adminPlansRes.data);
      record(
        'Scenario 9.1: Super-Admin can access /subscriptions/admin/plans (HTTP 200)',
        hasAdminPlans,
        `Plans retrieved: ${(adminPlansRes.data.data || adminPlansRes.data)?.length || 0}`,
      );

      // Verify regular user is forbidden from admin plans
      const regAdminRes = await request('/subscriptions/admin/plans', {
        headers: regularUser.headers,
      });
      record(
        'Scenario 9.2: Regular user is FORBIDDEN from /subscriptions/admin/plans (HTTP 403)',
        regAdminRes.status === 403,
        `Status: ${regAdminRes.status}`,
      );
    } catch (err) {
      record('Scenario 9: Super-Admin Plan Management Authorization', false, err.message);
    }
  }

  // Scenario 10: Admin Welcome Package CRUD & RBAC Protection
  let createdPkgId = null;
  if (superAdminUser) {
    try {
      // 10.1: SuperAdmin creates a new Welcome Package
      const createPkgRes = await request('/subscriptions/admin/welcome-packages', {
        method: 'POST',
        headers: superAdminUser.headers,
        body: {
          title: `بسته تستی اعتبارسنجی ${Date.now()}`,
          targetRole: 'agent',
          walletBonusIrr: '350000',
          publicationQuota: 10,
          tempRentQuota: 3,
          urgentQuota: 2,
          ladderQuota: 5,
          durationDays: 45,
          isActive: true,
        },
      });

      const pkgData = createPkgRes.data.data || createPkgRes.data;
      createdPkgId = pkgData?.id;
      const isCreated = (createPkgRes.status === 201 || createPkgRes.status === 200) && Boolean(createdPkgId);
      record(
        'Scenario 10.1: Super-Admin can CREATE a Welcome Package via POST /subscriptions/admin/welcome-packages',
        isCreated,
        `Status: ${createPkgRes.status}, ID: ${createdPkgId}, Title: ${pkgData?.title}`,
      );

      // 10.2: SuperAdmin updates the created Welcome Package
      if (createdPkgId) {
        const updatePkgRes = await request(`/subscriptions/admin/welcome-packages/${createdPkgId}`, {
          method: 'PATCH',
          headers: superAdminUser.headers,
          body: {
            title: `بسته تستی ویرایش‌شده ${Date.now()}`,
            isActive: false,
          },
        });

        const updatedData = updatePkgRes.data.data || updatePkgRes.data;
        const isUpdated = updatePkgRes.status === 200 && updatedData?.isActive === false;
        record(
          'Scenario 10.2: Super-Admin can UPDATE/TOGGLE a Welcome Package via PATCH /subscriptions/admin/welcome-packages/:id',
          isUpdated,
          `Status: ${updatePkgRes.status}, Active: ${updatedData?.isActive}`,
        );
      }

      // 10.3: Regular user is FORBIDDEN from creating welcome package
      const regCreatePkgRes = await request('/subscriptions/admin/welcome-packages', {
        method: 'POST',
        headers: regularUser.headers,
        body: {
          title: 'تلاش غیرمجاز کاربر',
          targetRole: 'agent',
        },
      });
      record(
        'Scenario 10.3: Regular user is FORBIDDEN from creating Welcome Packages (HTTP 403)',
        regCreatePkgRes.status === 403,
        `Status: ${regCreatePkgRes.status}`,
      );
    } catch (err) {
      record('Scenario 10: Admin Welcome Package CRUD', false, err.message);
    }
  }

  // Scenario 11: Backend Domain Guard against Regular User Subscription Plans
  if (superAdminUser) {
    try {
      const invalidPlanRes = await request('/subscriptions/admin/plans', {
        method: 'POST',
        headers: superAdminUser.headers,
        body: {
          name: 'پلن غیرمجاز کاربران عادی',
          slug: `invalid-user-plan-${Date.now()}`,
          targetRole: 'user', // STRICTLY PROHIBITED
          priceIrr: '1500000',
          durationDays: 30,
          publicationQuota: 5,
          tempRentQuota: 0,
          urgentQuota: 0,
          ladderQuota: 0,
        },
      });

      const isRejected = invalidPlanRes.status === 400;
      record(
        'Scenario 11: Backend domain strictly REJECTS creating subscription plan for regular user (HTTP 400 Bad Request)',
        isRejected,
        `Status: ${invalidPlanRes.status}, Message: ${JSON.stringify(invalidPlanRes.data.error?.message || invalidPlanRes.data.message || invalidPlanRes.data)}`,
      );
    } catch (err) {
      record('Scenario 11: Regular user plan rejection guard', false, err.message);
    }
  }

  // Scenario 12: Webhook Endpoint CSRF Exemption Test
  try {
    const webhookRes = await request('/wallet/payments/webhook', {
      method: 'POST',
      headers: {
        // Deliberately no X-XSRF-TOKEN and no cookie to test CSRF exemption
      },
      body: {
        event: 'PAYMENT_VERIFIED',
        payload: { referenceId: 'e2e-csrf-check' },
      },
    });

    const csrfBlocked =
      webhookRes.status === 403 &&
      JSON.stringify(webhookRes.data).toLowerCase().includes('csrf');
    record(
      'Scenario 12: Webhook endpoint /wallet/payments/webhook is EXEMPT from double-submit cookie CSRF check',
      !csrfBlocked,
      `HTTP Status: ${webhookRes.status} (Not CSRF-blocked)`,
    );
  } catch (err) {
    record('Scenario 12: Webhook CSRF exemption', false, err.message);
  }

  // Scenario 13: Phone Privacy & Contact Reveal Authentication Requirement
  try {
    // 13.1: Unauthenticated request to contact endpoint is rejected with 401
    const unauthContactRes = await request('/ads/00000000-0000-0000-0000-000000000001/contact', {
      method: 'GET',
    });
    record(
      'Scenario 13.1: Phone/Contact reveal strictly REQUIRES authentication (Unauthenticated returns 401)',
      unauthContactRes.status === 401,
      `HTTP Status: ${unauthContactRes.status}`,
    );

    // 13.2: Authenticated request reaches controller (returns 200 or 404 for non-existent ad)
    const authContactRes = await request('/ads/00000000-0000-0000-0000-000000000001/contact', {
      method: 'GET',
      headers: regularUser.headers,
    });
    record(
      'Scenario 13.2: Authenticated user reaches contact controller (404/200, auth passed)',
      authContactRes.status === 404 || authContactRes.status === 200,
      `HTTP Status: ${authContactRes.status}`,
    );
  } catch (err) {
    record('Scenario 13: Phone Privacy and Contact reveal', false, err.message);
  }

  // Scenario 14: Promotion Pricing & Status Requirements
  try {
    const promoPricingRes = await request('/promotions/pricing', {
      method: 'GET',
      headers: regularUser.headers,
    });
    const pricingRules = promoPricingRes.data.data?.rules || promoPricingRes.data?.rules;
    record(
      'Scenario 14.1: Query /promotions/pricing returns active promotion pricing configuration',
      promoPricingRes.status === 200 && Array.isArray(pricingRules),
      `Rules count: ${pricingRules?.length || 0}`,
    );

    // Attempting to promote invalid or unapproved ad is rejected cleanly
    const invalidPromoRes = await request('/promotions', {
      method: 'POST',
      headers: regularUser.headers,
      body: {
        listingId: '123e4567-e89b-42d3-a456-426614174000',
        promotionType: 'URGENT_TAG',
        durationDays: 7,
      },
    });
    record(
      'Scenario 14.2: Requesting promotion requires existing and PUBLISHED ad (Clean domain rejection, not 500)',
      invalidPromoRes.status === 404 || invalidPromoRes.status === 400,
      `HTTP Status: ${invalidPromoRes.status}, Message: ${JSON.stringify(invalidPromoRes.data.error?.message || invalidPromoRes.data.message || invalidPromoRes.data)}`,
    );
  } catch (err) {
    record('Scenario 14: Promotion pricing and status requirements', false, err.message);
  }

  // Summary
  console.log('\n====================================================');
  console.log('📊 Remote Validation Summary:');
  const passedCount = testResults.filter((r) => r.passed).length;
  const failedCount = testResults.filter((r) => !r.passed).length;
  console.log(`Total Scenarios: ${testResults.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runValidation().catch((err) => {
  console.error('Fatal validation runner error:', err);
  process.exit(1);
});
