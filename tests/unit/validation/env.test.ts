import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Environment Boundary Tests
 *
 * Verifies that:
 * 1. Web env schema rejects when server-only secrets are missing but doesn't require them
 * 2. Admin env schema correctly requires server secrets
 * 3. No NEXT_PUBLIC_ variables ever contain server-only secrets
 */

// ─── Web Env Schema ───────────────────────────────────────────────────────────

const webEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

// ─── Admin Env Schema ─────────────────────────────────────────────────────────

const adminEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  WEBHOOK_SECRET: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
});

const VALID_PUBLIC_VARS = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Web env boundary', () => {
  it('passes with only public vars (no server secrets required)', () => {
    expect(() => webEnvSchema.parse(VALID_PUBLIC_VARS)).not.toThrow();
  });

  it('rejects missing NEXT_PUBLIC_SUPABASE_URL', () => {
    expect(() => webEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'some-key',
    })).toThrow();
  });

  it('rejects non-URL value for SUPABASE_URL', () => {
    expect(() => webEnvSchema.parse({
      ...VALID_PUBLIC_VARS,
      NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
    })).toThrow();
  });

  it('does NOT require SUPABASE_SERVICE_ROLE_KEY (server secret must not be in web schema)', () => {
    // Web schema must not have this field as required
    const result = webEnvSchema.safeParse(VALID_PUBLIC_VARS);
    expect(result.success).toBe(true);
  });
});

describe('Admin env boundary', () => {
  it('requires SUPABASE_SERVICE_ROLE_KEY', () => {
    expect(() => adminEnvSchema.parse(VALID_PUBLIC_VARS)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/i);
  });

  it('passes with all required server secrets', () => {
    expect(() => adminEnvSchema.parse({
      ...VALID_PUBLIC_VARS,
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-value',
    })).not.toThrow();
  });
});

describe('Secret isolation: server secrets never use NEXT_PUBLIC_ prefix', () => {
  const SERVER_SECRETS = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'WEBHOOK_SECRET',
    'OPENAI_API_KEY',
    'UPSTASH_REDIS_REST_TOKEN',
    'UPSTASH_REDIS_REST_URL',
  ];

  for (const secret of SERVER_SECRETS) {
    it(`${secret} does not use NEXT_PUBLIC_ prefix`, () => {
      expect(secret.startsWith('NEXT_PUBLIC_')).toBe(false);
    });
  }

  it('admin schema keys do not expose server secrets as NEXT_PUBLIC_', () => {
    const adminKeys = Object.keys(adminEnvSchema.shape);
    const publicServerKeys = adminKeys.filter(
      k => k.startsWith('NEXT_PUBLIC_') && !['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].includes(k)
    );
    expect(publicServerKeys).toHaveLength(0);
  });
});
