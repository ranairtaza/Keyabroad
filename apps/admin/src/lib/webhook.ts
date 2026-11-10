import crypto from 'crypto';

/**
 * Verifies an HMAC-SHA256 signature for webhook payloads using timing-safe comparison.
 * Prevents timing attacks and handles signature length mismatches safely.
 *
 * @param payload - Raw request body string
 * @param signature - Incoming hex signature header (e.g. x-webhook-signature)
 * @returns boolean indicating whether signature is valid
 */
export function verifySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const digestBuffer = Buffer.from(digest, 'utf8');

  if (signatureBuffer.length !== digestBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
}

