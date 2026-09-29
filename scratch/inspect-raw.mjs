import https from 'node:https';

const API_BASE = 'https://beta.melktoday.ir/backend/api';

async function request(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = https.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      rejectUnauthorized: false,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.end();
  });
}

async function main() {
  const cats = await request(`${API_BASE}/ads/categories`);
  console.log('Categories API response:', JSON.stringify(cats, null, 2));

  const agencies = await request(`${API_BASE}/agencies`);
  console.log('Agencies API response:', JSON.stringify(agencies, null, 2));
}

main();
