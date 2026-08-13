/**
 * CSRF Security Tests
 *
 * Verifies that cross-origin POST requests are blocked by the middleware
 * Origin/Referer validation established in Phase 12.
 *
 * GO/NO-GO: ❌ NO-GO if ANY cross-origin mutating request succeeds
 */

const http = require('http');
const https = require('https');

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';

let passed = 0, failed = 0;

function assert(name, condition, actual) {
  if (condition) { console.log(`  ✅ ${name}`); passed++; }
  else { console.error(`  ❌ ${name} — Got: ${JSON.stringify(actual)}`); failed++; }
}

async function request(url, options = {}, body = null) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(url, options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log('\n🛡️  CSRF Security Tests\n');

  const EVIL_ORIGINS = [
    'https://evil.com',
    'https://attacker.keyabroad.com.evil.com',
    'null',
  ];

  const MUTATION_ENDPOINTS = [
    { method: 'POST', path: '/api/tasks' },
    { method: 'POST', path: '/api/notify' },
  ];

  for (const endpoint of MUTATION_ENDPOINTS) {
    for (const origin of EVIL_ORIGINS) {
      const res = await request(
        `${ADMIN_URL}${endpoint.path}`,
        {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Origin': origin,
            'Referer': `${origin}/attack`,
          },
        },
        JSON.stringify({ description: 'csrf-attack', content: 'csrf' })
      );
      assert(
        `${endpoint.method} ${endpoint.path} from Origin: ${origin} → blocked (401/403/405)`,
        [401, 403, 405].includes(res.status),
        res.status
      );
    }
  }

  console.log(`\nCSRF: ✅ ${passed} passed | ❌ ${failed} failed`);
  if (failed > 0) { console.error('❌ NO-GO: CSRF protection failure'); process.exit(1); }
  console.log('✅ CSRF protection verified');
}

run().catch(e => { console.error(e); process.exit(1); });
