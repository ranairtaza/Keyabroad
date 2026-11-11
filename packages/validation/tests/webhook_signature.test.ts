import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { verifySignature } from '../../../apps/admin/src/lib/webhook';

describe('SEC-06: Leads Webhook HMAC Signature Verification', () => {
  const TEST_SECRET = 'test_webhook_secret_key_12345';
  const TEST_PAYLOAD = JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
  });

  let originalSecret: string | undefined;

  beforeEach(() => {
    originalSecret = process.env.WEBHOOK_SECRET;
    process.env.WEBHOOK_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    process.env.WEBHOOK_SECRET = originalSecret;
  });

  it('accepts a valid signature matching the payload and secret', () => {
    const validDigest = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(TEST_PAYLOAD)
      .digest('hex');

    expect(verifySignature(TEST_PAYLOAD, validDigest)).toBe(true);
  });

  it('rejects an invalid signature with corrupted characters', () => {
    const validDigest = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(TEST_PAYLOAD)
      .digest('hex');

    // Use a deterministic corruption that cannot accidentally collide with the valid digest.
    // Flip every hex character: 0↔f, 1↔e, …, 7↔8 — guarantees every char differs.
    const invertedDigest = validDigest
      .split('')
      .map((c) => (0xf - parseInt(c, 16)).toString(16))
      .join('');
    expect(invertedDigest).not.toBe(validDigest); // sanity check
    expect(verifySignature(TEST_PAYLOAD, invertedDigest)).toBe(false);
  });

  it('rejects a signature when payload has been tampered with', () => {
    const validDigest = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(TEST_PAYLOAD)
      .digest('hex');

    const tamperedPayload = JSON.stringify({
      name: 'Malicious Attacker',
      email: 'attacker@example.com',
    });

    expect(verifySignature(tamperedPayload, validDigest)).toBe(false);
  });

  it('rejects missing or empty signatures safely without throwing', () => {
    expect(verifySignature(TEST_PAYLOAD, null)).toBe(false);
    expect(verifySignature(TEST_PAYLOAD, '')).toBe(false);
  });

  it('rejects different-length signatures safely without throwing RangeError', () => {
    const validDigest = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(TEST_PAYLOAD)
      .digest('hex');

    const truncated = validDigest.slice(0, 32);
    const extended = validDigest + 'ffff';

    expect(verifySignature(TEST_PAYLOAD, truncated)).toBe(false);
    expect(verifySignature(TEST_PAYLOAD, extended)).toBe(false);
  });

  it('rejects signatures when WEBHOOK_SECRET is not configured', () => {
    delete process.env.WEBHOOK_SECRET;

    const validDigest = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(TEST_PAYLOAD)
      .digest('hex');

    expect(verifySignature(TEST_PAYLOAD, validDigest)).toBe(false);
  });
});
