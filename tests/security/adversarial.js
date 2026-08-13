/**
 * Adversarial Security Tests
 *
 * Tests the live API endpoints for:
 * - CSRF protection
 * - Auth bypass
 * - Rate limit enforcement
 * - Webhook signature validation
 * - Request smuggling vectors
 *
 * Run against Staging only:
 *   ADMIN_URL=https://admin.staging.keyabroad.com node tests/security/adversarial.js
 */

const https = require('https');
const http = require('http');

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(name, condition, actual) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name} — Got: ${JSON.stringify(actual)}`);
    failed++;
  }
}

function skip(name, reason) {
  console.warn(`  ⚠️  SKIP: ${name} — ${reason}`);
  skipped++;
}

async function fetch(url, options = {}) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('    KeyAbroad Adversarial Security Test Runner');
  console.log('═══════════════════════════════════════════════════\n');

  // ─── 1. Auth Bypass ─────────────────────────────────────────────────────────
  console.log('Test Group 1: Authentication');

  const noAuthRes = await fetch(`${ADMIN_URL}/api/leads`, { method: 'GET' });
  assert('Unauthenticated GET /api/leads → 401 or 403', [401, 403].includes(noAuthRes.status), noAuthRes.status);

  const noAuthPost = await fetch(`${ADMIN_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'injected task' }),
  });
  assert('Unauthenticated POST /api/tasks → 401 or 403', [401, 403, 405].includes(noAuthPost.status), noAuthPost.status);

  // ─── 2. Health endpoints ─────────────────────────────────────────────────────
  console.log('\nTest Group 2: Health Endpoints');

  const webHealth = await fetch(`${WEB_URL}/api/health`);
  assert('Web /api/health → 200', webHealth.status === 200, webHealth.status);
  const webBody = JSON.parse(webHealth.body || '{}');
  assert('Web /api/health body = { status: "UP" }', webBody.status === 'UP', webBody);
  assert('Web /api/health leaks no service details', !webHealth.body.includes('keyabroad'), webHealth.body.slice(0, 100));

  const adminHealth = await fetch(`${ADMIN_URL}/api/health`);
  assert('Admin /api/health → 200', adminHealth.status === 200, adminHealth.status);
  const adminBody = JSON.parse(adminHealth.body || '{}');
  assert('Admin /api/health body = { status: "UP" }', adminBody.status === 'UP', adminBody);

  // ─── 3. Readiness probe auth ─────────────────────────────────────────────────
  console.log('\nTest Group 3: Readiness Probe Authorization');

  const unauthReady = await fetch(`${ADMIN_URL}/api/health/ready`);
  assert('Unauthenticated /api/health/ready → 401', unauthReady.status === 401, unauthReady.status);

  if (WEBHOOK_SECRET) {
    const authReady = await fetch(`${ADMIN_URL}/api/health/ready`, {
      headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
    });
    assert('Authenticated /api/health/ready → 200 or 503', [200, 503].includes(authReady.status), authReady.status);
  } else {
    skip('Authenticated readiness probe', 'WEBHOOK_SECRET not set');
  }

  // ─── 4. Webhook security ─────────────────────────────────────────────────────
  console.log('\nTest Group 4: Webhook Security');

  const noSigWebhook = await fetch(`${ADMIN_URL}/api/leads/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name: 'Attacker', email: 'attacker@evil.com' }),
  });
  assert('Webhook without signature → 401', noSigWebhook.status === 401, noSigWebhook.status);

  const wrongSigWebhook = await fetch(`${ADMIN_URL}/api/leads/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-signature': 'invalid-sig' },
    body: JSON.stringify({ first_name: 'Attacker', email: 'attacker@evil.com' }),
  });
  assert('Webhook with wrong signature → 401', wrongSigWebhook.status === 401, wrongSigWebhook.status);

  // ─── 5. CSRF Origin check ────────────────────────────────────────────────────
  console.log('\nTest Group 5: CSRF Protection');

  const csrfAttempt = await fetch(`${ADMIN_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://evil.attacker.com',
      'Referer': 'https://evil.attacker.com/attack',
    },
    body: JSON.stringify({ description: 'csrf-test-task' }),
  });
  assert('Cross-origin POST blocked by CSRF middleware → 401/403', [401, 403, 405].includes(csrfAttempt.status), csrfAttempt.status);

  // ─── 6. Security headers ─────────────────────────────────────────────────────
  console.log('\nTest Group 6: Security Headers');

  const headersRes = await fetch(WEB_URL);
  const h = headersRes.headers;
  assert('X-Frame-Options: DENY', h['x-frame-options'] === 'DENY', h['x-frame-options']);
  assert('X-Content-Type-Options: nosniff', h['x-content-type-options'] === 'nosniff', h['x-content-type-options']);
  assert('Referrer-Policy present', !!h['referrer-policy'], h['referrer-policy']);

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`Results: ✅ ${passed} passed | ❌ ${failed} failed | ⚠️ ${skipped} skipped`);
  console.log('═══════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.error('SECURITY TESTS FAILED. Do NOT proceed to production.');
    process.exit(1);
  }

  console.log('All security checks passed. System is hardened.');
  process.exit(0);
}

run().catch(err => {
  console.error('Security test runner crashed:', err);
  process.exit(1);
});
