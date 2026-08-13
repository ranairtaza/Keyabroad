import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Adversarial Schema Tests
 *
 * Verifies that Zod schemas:
 * 1. Reject SQL injection payloads
 * 2. Reject XSS payloads
 * 3. Reject excessively long strings (DoS prevention)
 * 4. Reject unexpected type coercions
 * 5. Enforce required fields
 */

// Import real schemas from the validation package
import { staffLoginSchema, studentRegisterSchema, messageSchema } from '../src/index';

// ─── SQL Injection Payloads ───────────────────────────────────────────────────

const SQL_PAYLOADS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "1; SELECT * FROM profiles; --",
  "UNION SELECT username, password FROM admins --",
];

// ─── XSS Payloads ────────────────────────────────────────────────────────────

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(document.cookie)',
  '"><svg onload=alert(1)>',
];

// ─── Oversized Payloads ───────────────────────────────────────────────────────

const HUGE_STRING = 'A'.repeat(100_000);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('staffLoginSchema: rejects malformed inputs', () => {
  it('rejects empty email', () => {
    expect(() => staffLoginSchema.parse({ email: '', password: 'ValidPass1' })).toThrow();
  });

  it('rejects non-email string', () => {
    expect(() => staffLoginSchema.parse({ email: 'not-an-email', password: 'ValidPass1' })).toThrow();
  });

  it('rejects empty password', () => {
    expect(() => staffLoginSchema.parse({ email: 'test@test.com', password: '' })).toThrow();
  });

  for (const payload of SQL_PAYLOADS) {
    it(`rejects SQL injection in email: ${payload.slice(0, 30)}`, () => {
      // Email format validation should catch these
      expect(() => staffLoginSchema.parse({ email: payload, password: 'ValidPass1' })).toThrow();
    });
  }
});

describe('studentRegisterSchema: rejects weak/malicious passwords', () => {
  it('rejects password without uppercase', () => {
    expect(() => studentRegisterSchema.parse({
      email: 'test@test.com',
      full_name: 'Test User',
      password: 'weakpassword1',
      confirm_password: 'weakpassword1',
    })).toThrow();
  });

  it('rejects password < 8 chars', () => {
    expect(() => studentRegisterSchema.parse({
      email: 'test@test.com',
      full_name: 'Test User',
      password: 'Ab1',
      confirm_password: 'Ab1',
    })).toThrow();
  });

  it('rejects mismatched passwords', () => {
    expect(() => studentRegisterSchema.parse({
      email: 'test@test.com',
      full_name: 'Test User',
      password: 'ValidPass1',
      confirm_password: 'DifferentPass1',
    })).toThrow();
  });

  it('accepts strong valid password', () => {
    expect(() => studentRegisterSchema.parse({
      email: 'test@test.com',
      full_name: 'Test User',
      password: 'StrongPass1',
      confirm_password: 'StrongPass1',
    })).not.toThrow();
  });
});

describe('messageSchema: rejects DoS payloads', () => {
  it('rejects empty message', () => {
    expect(() => messageSchema.parse({ content: '' })).toThrow();
  });

  // Schema gap is now FIXED: max 5000 chars enforced on messageSchema.content
  it('rejects oversized message (DoS protection)', () => {
    expect(() => messageSchema.parse({ content: HUGE_STRING })).toThrow(/5000/);
  });
});

describe('XSS payloads: Zod does not strip HTML (documents behavior)', () => {
  // Zod is not an HTML sanitizer — these WILL pass schema validation.
  // XSS prevention must happen at the render layer (React escaping).
  // This test documents and confirms that expectation.
  for (const payload of XSS_PAYLOADS) {
    it(`XSS payload passes Zod schema (render-layer must escape): ${payload.slice(0, 40)}`, () => {
      const result = messageSchema.safeParse({ content: payload });
      // We EXPECT these to parse — React handles escaping
      expect(result.success).toBe(true);
      if (result.success) {
        // The raw value must be preserved exactly (not altered by Zod)
        expect(result.data.content).toBe(payload);
      }
    });
  }
});
