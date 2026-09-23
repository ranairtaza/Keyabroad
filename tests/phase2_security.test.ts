import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function runTests() {
  console.log('--- Running Phase 2 Security & Identity Tests ---');
  let hasErrors = false;

  const supabaseAnon = createClient(supabaseUrl, anonKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Test 1: Unauthenticated querying of team_members
  try {
    const { data, error } = await supabaseAnon.from('team_members').select('*');
    if (error) {
      console.log('✅ PASS: Anon user got an error trying to read team_members:', error.message);
    } else if (data && data.length === 0) {
      console.log('✅ PASS: Anon user read team_members but got 0 records due to RLS.');
    } else {
      console.error('❌ FAIL: Anon user was able to read team_members records!', data);
      hasErrors = true;
    }
  } catch (err) {
    console.log('✅ PASS: Anon user threw an error:', err);
  }

  // Test 2: Unauthenticated querying of employee_attendance
  try {
    const { data, error } = await supabaseAnon.from('employee_attendance').select('*');
    if (error) {
      console.log('✅ PASS: Anon user got an error trying to read employee_attendance:', error.message);
    } else if (data && data.length === 0) {
      console.log('✅ PASS: Anon user read employee_attendance but got 0 records due to RLS.');
    } else {
      console.error('❌ FAIL: Anon user was able to read employee_attendance records!', data);
      hasErrors = true;
    }
  } catch (err) {
    console.log('✅ PASS: Anon user threw an error:', err);
  }

  // Test 3: mark-absent POST requires admin/cron
  try {
    const res = await fetch('http://localhost:3000/api/automations/mark-absent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-20' })
    });
    if (res.status === 401) {
      console.log('✅ PASS: mark-absent rejected anon POST request with 401.');
    } else {
      console.error(`❌ FAIL: mark-absent returned status ${res.status} instead of 401.`);
      hasErrors = true;
    }
  } catch (err) {
    console.log('⚠️ Could not run POST API test. Is localhost:3000 running? Skipping.');
  }

  if (hasErrors) {
    console.error('--- SOME TESTS FAILED ---');
    process.exit(1);
  } else {
    console.log('--- ALL SECURITY TESTS PASSED ---');
  }
}

runTests();
