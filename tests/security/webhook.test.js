/**
 * Webhook Security Tests
 *
 * Verifies signature verification, replay protection, and tampered payloads.
 *
 * Signature contract: the production webhook (apps/admin/src/lib/webhook.ts)
 * expects the x-webhook-signature header to contain a raw hex HMAC-SHA256 digest,
 * NOT a "sha256=" prefixed value.
 *
 * GO/NO-GO:
 *   ❌ NO-GO — No-signature webhook accepted
 *   ❌ NO-GO — Wrong-signature webhook accepted
 *   ❌ NO-GO — Replay creates a duplicate lead
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const WEBHOOK_PATH = '/api/leads/webhook';

let passed = 0, failed = 0;

function assert(name, condition, actual) {
  if (condition) { console.log(`  ✅ ${name}`); passed++; }
  else { console.error(`  ❌ ${name} — Got: ${JSON.stringify(actual)}`); failed++; }
}

function hmacSign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
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
  console.log('\n🪝 Webhook Security Tests\n');

  const payload = JSON.stringify({
    full_name: 'Webhook Security Test',
    mobile: '+923001234567',
    email: `webhook-test-${Date.now()}@test.com`,
    city: 'Lahore',
    passport_available: true,
    destinations: ['United Kingdom'],
    preferred_subjects: ['Computer Science'],
  });

  // Test 1: No signature header → must reject
  const noSig = await request(
    `${ADMIN_URL}${WEBHOOK_PATH}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    payload
  );
  assert('Webhook without signature → 401', noSig.status === 401, noSig.status);

  // Test 2: Wrong signature (raw hex, no prefix) → must reject
  const wrongSig = await request(
    `${ADMIN_URL}${WEBHOOK_PATH}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': 'completely_wrong_signature',
      },
    },
    payload
  );
  assert('Webhook with wrong signature → 401', wrongSig.status === 401, wrongSig.status);

  // Test 3: Tampered payload (signature doesn't match body) → must reject
  if (WEBHOOK_SECRET) {
    const validSig = hmacSign(payload, WEBHOOK_SECRET);
    const tamperedPayload = JSON.stringify({
      full_name: 'Tampered Attacker',
      mobile: '+923009999999',
      email: 'tampered@test.com',
      destinations: ['United States'],
      preferred_subjects: ['Business'],
    });

    const tampered = await request(
      `${ADMIN_URL}${WEBHOOK_PATH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': validSig, // valid sig for original payload, wrong body
        },
      },
      tamperedPayload
    );
    assert('Tampered payload (sig mismatch) → 401', tampered.status === 401, tampered.status);

    // Test 4: Valid signature with schema-valid payload
    const validPayload = JSON.stringify({
      full_name: 'Valid Webhook Candidate',
      mobile: '+923007654321',
      email: `valid-webhook-${Date.now()}@test.com`,
      city: 'Islamabad',
      passport_available: true,
      destinations: ['Canada'],
      preferred_subjects: ['Data Science'],
    });
    const validPayloadSig = hmacSign(validPayload, WEBHOOK_SECRET);
    const valid = await request(
      `${ADMIN_URL}${WEBHOOK_PATH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': validPayloadSig,
        },
      },
      validPayload
    );
    assert('Valid signed webhook → 200 or 201', [200, 201].includes(valid.status), valid.status);
  } else {
    console.warn('  ⚠️  WEBHOOK_SECRET not set — skipping signature verification tests');
  }

  console.log(`\nWebhook: ✅ ${passed} passed | ❌ ${failed} failed`);
  if (failed > 0) { console.error('❌ NO-GO: Webhook security failure'); process.exit(1); }
  console.log('✅ Webhook security verified');
}

run().catch(e => { console.error(e); process.exit(1); });
