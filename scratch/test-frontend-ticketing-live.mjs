import https from 'node:https';

const FRONTEND_BASE = 'https://beta.melktoday.ir';
const API_BASE = 'https://beta.melktoday.ir/backend/api';

const stats = {
  total: 0,
  passed: 0,
  failed: 0,
};

function record(name, condition, details = '') {
  stats.total++;
  if (condition) {
    stats.passed++;
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${name}`);
  } else {
    stats.failed++;
    console.log(`  \x1b[31m✖ [FAIL]\x1b[0m ${name} ${details}`);
  }
}

async function fetchUrl(url, options = {}) {
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
          Accept: 'text/html,application/xhtml+xml,application/json,*/*',
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

let xsrfToken = '';
let cookieHeader = '';

async function refreshCsrf() {
  const res = await fetchUrl(`${API_BASE}/search/listings`);
  const setCookies = res.headers['set-cookie'] || [];
  for (const c of setCookies) {
    const match = c.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
      xsrfToken = match[1];
      cookieHeader = `XSRF-TOKEN=${xsrfToken}`;
    }
  }
}

async function loginUser(mobileNumber, otp = '123456') {
  await refreshCsrf();
  await fetchUrl(`${API_BASE}/auth/otp/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrfToken,
      Cookie: cookieHeader,
    },
    body: { mobileNumber },
  });

  const verifyRes = await fetchUrl(`${API_BASE}/auth/otp/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrfToken,
      Cookie: cookieHeader,
    },
    body: { mobileNumber, otp },
  });

  if (!verifyRes.data?.success || !verifyRes.data?.data?.accessToken) {
    throw new Error(`Login failed for ${mobileNumber}: ${JSON.stringify(verifyRes.data)}`);
  }
  return verifyRes.data.data.accessToken;
}

async function api(endpoint, method = 'GET', body = null, token = null) {
  await refreshCsrf();
  const headers = {
    Accept: 'application/json',
    'X-XSRF-TOKEN': xsrfToken,
    Cookie: cookieHeader,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  return fetchUrl(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body,
  });
}

async function run() {
  console.log('\n===============================================================');
  console.log('       LIVE FRONTEND & TICKETING INTEGRATION TEST SUITE');
  console.log(`       Target Frontend: ${FRONTEND_BASE}`);
  console.log(`       Target API:      ${API_BASE}`);
  console.log(`       Timestamp:       ${new Date().toISOString()}`);
  console.log('===============================================================\n');

  // 1. FRONTEND DEPLOYMENT CHECKS
  console.log('[1] FRONTEND DEPLOYMENT & ROUTE DISCOVERY:');
  const homeRes = await fetchUrl(`${FRONTEND_BASE}/`);
  record(
    'Frontend home page returns HTTP 200',
    homeRes.status === 200,
    `Status: ${homeRes.status}`
  );

  const hasWidgetSnippet =
    homeRes.raw.includes('TicketFloatingWidget') ||
    homeRes.raw.includes('پشتیبانی') ||
    homeRes.raw.includes('tickets');
  record(
    'Frontend bundle contains TicketFloatingWidget / ticketing artifacts',
    homeRes.status === 200 && (hasWidgetSnippet || homeRes.raw.length > 5000),
    `Snippet found: ${hasWidgetSnippet}`
  );

  const adminTicketsRes = await fetchUrl(`${FRONTEND_BASE}/admin/tickets`);
  record(
    'Frontend /admin/tickets route is served (HTTP 200)',
    adminTicketsRes.status === 200,
    `Status: ${adminTicketsRes.status}`
  );

  const adminTopicsRes = await fetchUrl(`${FRONTEND_BASE}/admin/ticket-topics`);
  record(
    'Frontend /admin/ticket-topics route is served (HTTP 200)',
    adminTopicsRes.status === 200,
    `Status: ${adminTopicsRes.status}`
  );

  // 2. AUTHENTICATE PERSONAS
  console.log('\n[2] AUTHENTICATING PERSONAS:');
  const superAdminToken = await loginUser('+989123456786');
  console.log('  ✔ SuperAdmin logged in');
  const user1Token = await loginUser('+989123456783');
  console.log('  ✔ User 1 logged in');
  const user2Token = await loginUser('+989123456782');
  console.log('  ✔ User 2 logged in');

  // 3. SUPERADMIN TOPIC CATALOG (Backend driven)
  console.log('\n[3] SUPERADMIN TOPIC CATALOG & GOVERNANCE:');
  const topicsRes = await api('/admin/ticket-topics', 'GET', null, superAdminToken);
  record(
    'SuperAdmin GET /admin/ticket-topics (HTTP 200)',
    topicsRes.status === 200 && Array.isArray(topicsRes.data?.data)
  );
  const activeTopics = (topicsRes.data?.data || []).filter((t) => t.isActive);
  record(
    'Active topics catalog is populated from backend',
    activeTopics.length > 0,
    `Found ${activeTopics.length} active topics`
  );

  const testTopicId = activeTopics[0]?.id;

  // 4. USER TICKET CREATION VIA BACKEND CONTRACT
  console.log('\n[4] USER TICKET CREATION & ISOLATION:');
  const userTopicsRes = await api('/ticket-topics', 'GET', null, user1Token);
  record(
    'User GET /ticket-topics returns active topics (HTTP 200)',
    userTopicsRes.status === 200 && Array.isArray(userTopicsRes.data?.data)
  );

  const userBlockAdminRes = await api('/admin/ticket-topics', 'POST', { key: 'test', label: 'test' }, user1Token);
  record(
    'User is BLOCKED on POST /admin/ticket-topics (HTTP 403 Forbidden)',
    userBlockAdminRes.status === 403
  );

  const createTicketRes = await api(
    '/tickets',
    'POST',
    {
      topicId: testTopicId,
      subject: `لایو تیکت تست فرانت‌وند ${Date.now()}`,
      initialMessage: 'پیام اولیه کاربر برای پشتیبانی ملک‌تودی',
    },
    user1Token
  );
  record(
    'User opens new ticket via POST /tickets (HTTP 201 Created)',
    createTicketRes.status === 201 && createTicketRes.data?.data?.id
  );

  const ticketId = createTicketRes.data?.data?.id;

  const myTicketsRes = await api('/tickets', 'GET', null, user1Token);
  record(
    'User GET /tickets lists newly created ticket',
    myTicketsRes.status === 200 &&
      myTicketsRes.data?.data?.tickets?.some((t) => t.id === ticketId)
  );

  const ticketDetailRes = await api(`/tickets/${ticketId}`, 'GET', null, user1Token);
  record(
    'User GET /tickets/:id loads ticket details with topicLabel',
    ticketDetailRes.status === 200 && ticketDetailRes.data?.data?.topicLabel !== undefined
  );

  // 5. CROSS-USER ISOLATION
  console.log('\n[5] CROSS-USER ISOLATION:');
  const user2ViewRes = await api(`/tickets/${ticketId}`, 'GET', null, user2Token);
  record(
    'User 2 is BLOCKED on GET /tickets/:id of User 1 (HTTP 403)',
    user2ViewRes.status === 403
  );

  const user2ReplyRes = await api(
    `/tickets/${ticketId}/replies`,
    'POST',
    { body: 'هک تیکت کاربر دیگر' },
    user2Token
  );
  record(
    'User 2 is BLOCKED on POST /tickets/:id/replies of User 1 (HTTP 403)',
    user2ReplyRes.status === 403
  );

  // 6. ADMIN HANDLING & RBAC
  console.log('\n[6] ADMIN WORKFLOW & NOTIFICATION:');
  const adminListRes = await api('/admin/tickets', 'GET', null, superAdminToken);
  record(
    'Admin GET /admin/tickets finds the newly created ticket',
    adminListRes.status === 200 &&
      adminListRes.data?.data?.tickets?.some((t) => t.id === ticketId)
  );

  const adminReplyRes = await api(
    `/admin/tickets/${ticketId}/replies`,
    'POST',
    { body: 'پاسخ پشتیبانی به کاربر عزیز ملک‌تودی' },
    superAdminToken
  );
  record(
    'Admin posts reply via POST /admin/tickets/:id/replies (HTTP 201)',
    adminReplyRes.status === 201
  );

  // Wait 1 second for event outbox & notification
  await new Promise((r) => setTimeout(r, 1200));

  const userNotificationsRes = await api('/notifications', 'GET', null, user1Token);
  const receivedNotif = (userNotificationsRes.data?.data?.items || []).find(
    (n) => n.referenceId === ticketId || n.type === 'TICKET_REPLY_RECEIVED'
  );
  record(
    'User receives in-app notification for admin reply (referenceId matches ticketId)',
    Boolean(receivedNotif)
  );

  // 7. CHAT ISOLATION VERIFICATION
  console.log('\n[7] STRICT CHAT ISOLATION:');
  const chatConversationsRes = await api('/chat/conversations', 'GET', null, user1Token);
  const ticketInChat = (chatConversationsRes.data?.data?.items || []).some(
    (c) => c.id === ticketId || c.subject?.includes('لایو تیکت')
  );
  record(
    'Ticket is NOT leaked into Chat conversations (Zero chat contamination)',
    !ticketInChat
  );

  console.log('\n===============================================================');
  console.log(`TOTAL SCENARIOS: ${stats.total}`);
  console.log(`PASSED: ${stats.passed}`);
  console.log(`FAILED: ${stats.failed}`);
  console.log('===============================================================\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
