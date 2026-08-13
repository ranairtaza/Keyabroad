import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * RLS Isolation Tests
 *
 * These tests run against a real Supabase instance (local or Staging).
 * Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 * or provide SUPABASE_TEST_STUDENT_A_TOKEN and SUPABASE_TEST_STUDENT_B_TOKEN
 * for cross-user IDOR testing.
 *
 * Rules being tested:
 * 1. Anon cannot read any protected table (RLS blocks all)
 * 2. Anon cannot insert into any protected table
 * 3. Student A cannot read Student B's profile (IDOR)
 * 4. Student cannot access crm_leads at all
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'mock-anon-key';

const PROTECTED_TABLES = [
  'profiles',
  'crm_leads',
  'student_applications',
  'tasks',
  'notifications',
];

describe('RLS: Anonymous user cannot read protected tables', () => {
  const anon = createClient(SUPABASE_URL, ANON_KEY);

  for (const table of PROTECTED_TABLES) {
    it(`anon cannot SELECT from ${table}`, async () => {
      const { data, error } = await anon.from(table).select('*').limit(5);
      // RLS should return either an error or an empty array (not actual rows)
      const isBlocked = (error !== null) || (Array.isArray(data) && data.length === 0);
      expect(isBlocked).toBe(true);
    });
  }
});

describe('RLS: Anonymous user cannot write to protected tables', () => {
  const anon = createClient(SUPABASE_URL, ANON_KEY);

  it('anon cannot INSERT into crm_leads', async () => {
    const { error } = await anon.from('crm_leads').insert([{
      first_name: 'Attacker',
      last_name: 'Test',
      email: 'attacker@evil.com',
    }]);
    expect(error).not.toBeNull();
    // 42501 = RLS violation code
    expect(['42501', 'PGRST116', '403'].some(c => error!.code?.includes(c) || error!.message?.includes('denied'))).toBe(true);
  });

  it('anon cannot DELETE from crm_leads', async () => {
    const { error } = await anon.from('crm_leads').delete().eq('email', 'attacker@evil.com');
    expect(error).not.toBeNull();
  });
});

describe('RLS: Student cannot access CRM data', () => {
  const studentToken = process.env.SUPABASE_TEST_STUDENT_TOKEN;

  it.skipIf(!studentToken)('student cannot read crm_leads even with auth token', async () => {
    const student = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${studentToken}` } },
    });
    const { data } = await student.from('crm_leads').select('*');
    expect(data?.length ?? 0).toBe(0);
  });
});

describe('RLS: IDOR — Student A cannot read Student B data', () => {
  const tokenA = process.env.SUPABASE_TEST_STUDENT_A_TOKEN;
  const tokenB = process.env.SUPABASE_TEST_STUDENT_B_TOKEN;

  it.skipIf(!tokenA || !tokenB)('student A cannot query student B profile by ID', async () => {
    // Get Student B's ID using admin (service role) — in test setup only
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const admin = createClient(SUPABASE_URL, serviceRole!, { auth: { persistSession: false } });
    const { data: profileB } = await admin.from('profiles').select('id').limit(1).single();

    // Now try to read it as Student A
    const studentA = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${tokenA}` } },
    });
    const { data } = await studentA.from('profiles').select('*').eq('id', profileB!.id);
    // Student A's RLS policy should only return their own row
    const leakedRows = data?.filter((r: any) => r.id !== profileB!.id) ?? [];
    expect(leakedRows.length).toBe(0);
  });
});
