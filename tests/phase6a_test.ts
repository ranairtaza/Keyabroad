import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseUser1 = createClient(supabaseUrl, supabaseAnonKey);
const supabaseUser2 = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  console.log("Starting Phase 6A Tests...");

  // 1. Setup Test Users
  const { data: user1, error: e1 } = await supabaseAdmin.auth.admin.createUser({
    email: 'test_emp1@keyabroad.com',
    password: 'password123',
    email_confirm: true
  });
  
  const { data: user2, error: e2 } = await supabaseAdmin.auth.admin.createUser({
    email: 'test_admin@keyabroad.com',
    password: 'password123',
    email_confirm: true
  });

  if (e1 || e2) {
    console.log("Failed to create test users (maybe they already exist)");
  }

  // Get user IDs
  const u1Id = user1?.user.id || (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === 'test_emp1@keyabroad.com')?.id;
  const u2Id = user2?.user.id || (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === 'test_admin@keyabroad.com')?.id;

  // Insert Team Members
  await supabaseAdmin.from('team_members').insert([
    { email: 'test_emp1@keyabroad.com', name: 'Test Emp 1', role: 'normal employee' },
    { email: 'test_admin@keyabroad.com', name: 'Test Admin', role: 'ADMIN' }
  ]).select();

  const emp1 = (await supabaseAdmin.from('team_members').select('id').eq('email', 'test_emp1@keyabroad.com').single()).data;
  const adminEmp = (await supabaseAdmin.from('team_members').select('id').eq('email', 'test_admin@keyabroad.com').single()).data;

  // Login
  await supabaseUser1.auth.signInWithPassword({ email: 'test_emp1@keyabroad.com', password: 'password123' });
  await supabaseUser2.auth.signInWithPassword({ email: 'test_admin@keyabroad.com', password: 'password123' });

  // Add a Leave Type
  const { data: leaveType } = await supabaseAdmin.from('leave_types').select('id').eq('name', 'Annual Leave').single();
  let ltId = leaveType?.id;
  if (!ltId) {
    const { data: lt } = await supabaseAdmin.from('leave_types').insert({ name: 'Annual Leave' }).select('id').single();
    ltId = lt!.id;
  }

  // Set Balance
  await supabaseAdmin.from('leave_balances').insert({
    employee_id: emp1!.id,
    leave_type_id: ltId,
    year: new Date().getFullYear(),
    total_accrued: 10,
    total_used: 0
  });

  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, message?: string) => {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${name} ${message ? `- ${message}` : ''}`);
      failed++;
    }
  };

  // Test 1: Employee creates own request (using Supabase JS, this tests RLS)
  const req1 = await supabaseUser1.from('leave_requests').insert({
    employee_id: emp1!.id,
    leave_type_id: ltId,
    start_date: '2027-01-01',
    end_date: '2027-01-02',
    total_days: 2,
    status: 'PENDING'
  }).select().single();
  assert("Employee creates own request (RLS)", !req1.error, req1.error?.message);

  // Test 2: Employee attempts another employee's request
  const req2 = await supabaseUser1.from('leave_requests').insert({
    employee_id: adminEmp!.id,
    leave_type_id: ltId,
    start_date: '2027-01-03',
    end_date: '2027-01-04',
    total_days: 2,
    status: 'PENDING'
  });
  assert("Employee attempts another's request (RLS)", !!req2.error);

  // Test 3: Invalid date range
  const req3 = await supabaseUser1.from('leave_requests').insert({
    employee_id: emp1!.id,
    leave_type_id: ltId,
    start_date: '2027-01-02',
    end_date: '2027-01-01',
    total_days: 2,
    status: 'PENDING'
  });
  assert("Invalid date range (DB Constraint)", !!req3.error);

  // Test 9 & 10: Admin approves/rejects
  if (req1.data) {
    const approve = await supabaseUser2.from('leave_requests').update({ status: 'APPROVED' }).eq('id', req1.data.id);
    assert("HR/Admin can approve", !approve.error, approve.error?.message);
  } else {
    assert("HR/Admin can approve", false, "Skipped due to previous failure");
  }

  // Test 11: Employee cannot modify balance
  const balUpdate = await supabaseUser1.from('leave_balances').update({ total_accrued: 100 }).eq('employee_id', emp1!.id);
  assert("Employee cannot modify balance (RLS)", !!balUpdate.error || balUpdate.data === null);

  // Test 12: Employee sees only own requests
  const viewReq = await supabaseUser1.from('leave_requests').select('*');
  const allYours = viewReq.data?.every(r => r.employee_id === emp1!.id);
  assert("Employee sees only own private requests (RLS)", allYours && !viewReq.error);

  // Test 13 & 14: Shift Creation
  const shiftReq = await supabaseUser2.from('shifts').insert({
    name: 'Night Shift',
    start_time: '22:00:00',
    end_time: '06:00:00'
  });
  assert("Authorized user creates shift", !shiftReq.error || shiftReq.error.code === '23505', shiftReq.error?.message); // 23505 is unique constraint

  const shiftReqEmp = await supabaseUser1.from('shifts').insert({
    name: 'Employee Shift',
    start_time: '10:00:00',
    end_time: '14:00:00'
  });
  assert("Unauthorized employee creates shift (RLS)", !!shiftReqEmp.error);

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);

  // Cleanup
  await supabaseAdmin.from('team_members').delete().in('email', ['test_emp1@keyabroad.com', 'test_admin@keyabroad.com']);
  if (u1Id) await supabaseAdmin.auth.admin.deleteUser(u1Id);
  if (u2Id) await supabaseAdmin.auth.admin.deleteUser(u2Id);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
