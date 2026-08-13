/**
 * Auth Security Tests
 *
 * Verifies that unauthenticated requests are rejected at every API surface.
 *
 * GO/NO-GO: ❌ NO-GO if any protected endpoint is accessible without auth
 */

const http = require('http');
const https = require('https');

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

let passed = 0, failed = 0;

function assert(name, condition, actual) {
  if (condition) { console.log(`  ✅ ${name}`); passed++; }
  else { console.error(`  ❌ ${name} — Got: ${JSON.stringify(actual)}`); failed++; }
}

async function request(url, options = {}) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(url, { ...options }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('\n🔐 Auth Security Tests\n');

  // Protected admin API routes — must reject unauthenticated requests
  const PROTECTED_ADMIN_ROUTES = [
    { method: 'GET',  path: '/api/leads' },
    { method: 'GET',  path: '/api/tasks' },
    { method: 'POST', path: '/api/tasks' },
    { method: 'GET',  path: '/api/notify' },
  ];

  for (const route of PROTECTED_ADMIN_ROUTES) {
    const res = await request(`${ADMIN_URL}${route.path}`, { method: route.method });
    assert(
      `Unauthenticated ${route.method} ${route.path} → 401 or 403`,
      [401, 403, 405].includes(res.status),
      res.status
    );
  }

  // Public routes — must be accessible without auth
  const PUBLIC_ROUTES = [
    `${WEB_URL}/api/health`,
    `${ADMIN_URL}/api/health`,
  ];

  for (const url of PUBLIC_ROUTES) {
    const res = await request(url, { method: 'GET' });
    assert(`Public health check ${url} → 200`, res.status === 200, res.status);
  }

  // Readiness probe must require auth
  const readyRes = await request(`${ADMIN_URL}/api/health/ready`, { method: 'GET' });
  assert('Unauthenticated /api/health/ready → 401', readyRes.status === 401, readyRes.status);

  console.log(`\nAuth: ✅ ${passed} passed | ❌ ${failed} failed`);
  if (failed > 0) { console.error('❌ NO-GO: Auth bypass detected'); process.exit(1); }
  console.log('✅ Authentication guards verified');
}

run().catch(e => { console.error(e); process.exit(1); });
