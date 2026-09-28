import fs from 'fs';
import path from 'path';

const BASE = 'https://beta.melktoday.ir/backend/api';
const XSRF = '5caaf73c6ff916f018fd3addeab3c201dc8529078f5db6349a0ad3c875127a22';

interface TokenPayload {
  sub: string;
  sessionId: string;
  activeRoleId?: string;
  activeRoleName?: string;
  exp?: number;
}

interface CookieObject {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Lax';
  expires: number;
}

interface StorageStateData {
  cookies: CookieObject[];
  origins: unknown[];
}

async function getRoleToken(phone: string, targetRole?: string): Promise<string> {
  await fetch(`${BASE}/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': XSRF, Cookie: `XSRF-TOKEN=${XSRF}` },
    body: JSON.stringify({ mobileNumber: phone }),
  });

  const r = await fetch(`${BASE}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': XSRF, Cookie: `XSRF-TOKEN=${XSRF}` },
    body: JSON.stringify({ mobileNumber: phone, otp: '123456' }),
  });

  const json = (await r.json()) as { data?: { accessToken?: string } };
  let token = json?.data?.accessToken;
  if (!token) throw new Error(`Could not obtain token for ${phone}: ${JSON.stringify(json)}`);

  const parts = token.split('.');
  if (parts.length > 1 && targetRole && parts[1]) {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8')) as TokenPayload;
    if (payload.activeRoleName !== targetRole && payload.sessionId) {
      const sw = await fetch(`${BASE}/auth/sessions/switch-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-XSRF-TOKEN': XSRF,
          Cookie: `XSRF-TOKEN=${XSRF}; access_token=${token}`,
        },
        body: JSON.stringify({
          sessionId: payload.sessionId,
          roleName: targetRole,
        }),
      });
      const swData = (await sw.json()) as { data?: { accessToken?: string } };
      if (swData?.data?.accessToken) {
        token = swData.data.accessToken;
      }
    }
  }

  return token;
}

export default async function globalSetup() {
  const authDir = path.join(__dirname, '../playwright/.auth');
  fs.mkdirSync(authDir, { recursive: true });

  const makeState = (token: string): StorageStateData => ({
    cookies: [
      {
        name: 'access_token',
        value: token,
        domain: 'beta.melktoday.ir',
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 86400 * 30,
      },
      {
        name: 'XSRF-TOKEN',
        value: XSRF,
        domain: 'beta.melktoday.ir',
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 86400 * 30,
      },
    ],
    origins: [],
  });

  const isValidState = async (filePath: string, probeUrl: string, expectedRole?: string): Promise<boolean> => {
    try {
      if (!fs.existsSync(filePath)) return false;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as StorageStateData;
      const tokenCookie = data.cookies?.find((c) => c.name === 'access_token');
      if (!tokenCookie) {
        return false;
      }

      const parts = tokenCookie.value.split('.');
      if (parts.length > 1 && parts[1]) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8')) as TokenPayload;
        if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000) + 120) {
          return false;
        }
        if (expectedRole && payload.activeRoleName !== expectedRole) return false;
      }

      const res = await fetch(probeUrl, {
        headers: { Authorization: `Bearer ${tokenCookie.value}` },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  };

  const roleConfigs = [
    {
      file: 'superadmin.json',
      phone: '+989123456786',
      role: 'super-admin',
      probe: `${BASE}/admin/users?page=1&limit=1`,
    },
    {
      file: 'admin.json',
      phone: '+989123456781',
      role: 'admin',
      probe: `${BASE}/admin/users?page=1&limit=1`,
    },
    {
      file: 'agent.json',
      phone: '+989123456782',
      role: 'agent',
      probe: `${BASE}/wallet/balance`,
    },
    {
      file: 'landlord.json',
      phone: '+989123456784',
      role: 'landlord',
      probe: `${BASE}/wallet/balance`,
    },
    {
      file: 'user.json',
      phone: '+989123456783',
      role: 'user',
      probe: `${BASE}/wallet/balance`,
    },
  ];

  for (const config of roleConfigs) {
    const filePath = path.join(authDir, config.file);
    const valid = await isValidState(filePath, config.probe, config.role);
    if (!valid) {
      try {
        const token = await getRoleToken(config.phone, config.role);
        fs.writeFileSync(filePath, JSON.stringify(makeState(token), null, 2));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[global-setup] Could not initialize auth state for ${config.role}: ${message}`);
      }
    }
  }
}
