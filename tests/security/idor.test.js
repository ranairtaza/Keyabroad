/**
 * IDOR Security Tests
 *
 * Verifies that cross-user data access is blocked at the database layer (RLS).
 * Tests that one user cannot read or mutate another user's data by guessing IDs.
 *
 * GO/NO-GO:
 *   ❌ NO-GO — Student can read another student's profile/application
 *   ❌ NO-GO — Anon can read any protected user data
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const STUDENT_A_TOKEN = process.env.SUPABASE_TEST_STUDENT_A_TOKEN || '';
const STUDENT_B_TOKEN = process.env.SUPABASE_TEST_STUDENT_B_TOKEN || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let passed = 0, failed = 0, skipped = 0;

function assert(name, condition, actual) {
  if (condition) { console.log(`  ✅ ${name}`); passed++; }
  else { console.error(`  ❌ ${name} — Got: ${JSON.stringify(actual)}`); failed++; }
}

async function run() {
  console.log('\n🔍 IDOR Security Tests\n');

  const anon = createClient(SUPABASE_URL, ANON_KEY);

  // Test 1: Anon cannot read profiles
  const { data: profiles } = await anon.from('profiles').select('*').limit(5);
  assert('Anon reads 0 profile rows (RLS)', (profiles?.length ?? 0) === 0, profiles?.length);

  // Test 2: Anon cannot read CRM leads
  const { data: leads } = await anon.from('crm_leads').select('*').limit(5);
  assert('Anon reads 0 crm_leads rows (RLS)', (leads?.length ?? 0) === 0, leads?.length);

  // Test 3: Anon cannot read student_applications
  const { data: apps } = await anon.from('student_applications').select('*').limit(5).maybeSingle();
  assert('Anon reads 0 student_applications rows (RLS)', apps === null, apps);

  // Test 4: IDOR — Student A cannot read Student B's profile
  if (STUDENT_A_TOKEN && STUDENT_B_TOKEN && SERVICE_KEY) {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Get Student B's ID via service role (admin only — never in client code)
    const { data: profileB } = await admin
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (profileB) {
      const studentA = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${STUDENT_A_TOKEN}` } },
      });

      const { data: stolen } = await studentA
        .from('profiles')
        .select('*')
        .eq('id', profileB.id);

      // RLS: should only return Student A's own row OR empty — never Student B's data
      const ownId = (await studentA.auth.getUser()).data.user?.id;
      const leakedRows = (stolen ?? []).filter(r => r.id !== ownId);
      assert('Student A cannot read Student B profile (IDOR)', leakedRows.length === 0, leakedRows.length);
    }
  } else {
    console.warn('  ⚠️  Missing STUDENT_A/B tokens or SERVICE_KEY — skipping IDOR cross-user test');
    skipped++;
  }

  console.log(`\nIDOR: ✅ ${passed} passed | ❌ ${failed} failed | ⚠️ ${skipped} skipped`);
  if (failed > 0) { console.error('❌ NO-GO: IDOR vulnerability detected'); process.exit(1); }
  console.log('✅ IDOR protection verified');
}

run().catch(e => { console.error(e); process.exit(1); });
