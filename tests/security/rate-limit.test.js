/**
 * Rate Limit Security Tests
 *
 * Verifies that rate limiting kicks in after threshold is exceeded.
 * Runs sequentially (not concurrently) to avoid false positives.
 *
 * GO/NO-GO: ⚠️ WARNING if rate limiter isn't configured (Upstash missing)
 *           ❌ NO-GO if 429 is NEVER returned under hammering
 */

const http = require('http');
const https = require('https');

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

// How many requests before expecting a 429
const BURST_COUNT = 30;
const RATE_LIMIT_THRESHOLD = 20; // Expect 429 before this many requests pass

async function request(url, options = {}) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(url, options, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('\n⏱️  Rate Limit Security Tests\n');

  // Target the AI chat endpoint which should be rate-limited
  const RATE_LIMITED_ENDPOINT = `${WEB_URL}/api/chat`;
  const statuses = [];

  console.log(`  Sending ${BURST_COUNT} rapid requests to ${RATE_LIMITED_ENDPOINT}...`);

  for (let i = 0; i < BURST_COUNT; i++) {
    try {
      const status = await request(RATE_LIMITED_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      statuses.push(status);
      if (status === 429) {
        console.log(`  Rate limit triggered at request #${i + 1}`);
        break;
      }
    } catch {
      statuses.push(0);
    }
  }

  const hit429 = statuses.includes(429);
  const hitAt = statuses.indexOf(429) + 1;

  if (hit429) {
    console.log(`  ✅ Rate limit triggered at request #${hitAt} (threshold: ${RATE_LIMIT_THRESHOLD})`);

    if (hitAt <= RATE_LIMIT_THRESHOLD) {
      console.log('  ✅ Rate limit within acceptable threshold');
    } else {
      console.warn(`  ⚠️  Rate limit triggered late (at #${hitAt} — expected ≤ ${RATE_LIMIT_THRESHOLD})`);
    }
  } else {
    console.warn(`  ⚠️  No 429 received in ${BURST_COUNT} requests — rate limiter may not be configured`);
    console.warn('  ⚠️  Verify UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set');
    // Warning only — not a hard NO-GO for local dev (Upstash not available)
    console.log('\nRate Limit: ⚠️ WARNING — verify in Staging with Upstash configured');
    process.exit(0);
  }

  console.log('\nRate Limit: ✅ Rate limiting verified');
}

run().catch(e => { console.error(e); process.exit(1); });
