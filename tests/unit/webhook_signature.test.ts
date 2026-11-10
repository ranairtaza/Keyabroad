import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { verifySignature } from '../../apps/admin/src/lib/webhook';

describe('SEC-06: Leads Webhook HMAC Signature Verification (Root Unit Suite)', () => {
  const TEST_SECRET = 'test_webhook_secret_key_12345';
  const TEST_PAYLOAD = JSON.stringify({
    name: 'Jane Doe',
    email: 'jane@example.com',
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

    const corruptedDigest = validDigest.slice(0, -2) + 'aa';
    expect(verifySignature(TEST_PAYLOAD, corruptedDigest)).toBe(false);
  });

  it('rejects missing or empty signatures', () => {
    expect(verifySignature(TEST_PAYLOAD, null)).toBe(false);
    expect(verifySignature(TEST_PAYLOAD, '')).toBe(false);
  });

  it('rejects different-length signatures safely without throwing RangeError', () => {
    const validDigest = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(TEST_PAYLOAD)
      .digest('hex');

    expect(verifySignature(TEST_PAYLOAD, validDigest.slice(0, 16))).toBe(false);
    expect(verifySignature(TEST_PAYLOAD, validDigest + 'extra')).toBe(false);
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

