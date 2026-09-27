import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Fix TS absolute imports by simulating it or just importing relatively
import { calculateWorkforceStatus } from '../apps/admin/src/lib/hr/workforceStatus';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runTests() {
  console.log("Starting Phase 6B Workforce Engine & API Tests...");

  // 1. Setup Test Users directly in DB
  const { data: user1, error: e1 } = await supabaseAdmin.auth.admin.createUser({
    email: 'test_emp1_workforce@keyabroad.com',
    password: 'password123',
    email_confirm: true
  });
  
  const { data: admin, error: e2 } = await supabaseAdmin.auth.admin.createUser({
    email: 'test_admin_workforce@keyabroad.com',
    password: 'password123',
    email_confirm: true
  });

  const u1Id = user1?.user?.id || (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === 'test_emp1_workforce@keyabroad.com')?.id;
  const adminId = admin?.user?.id || (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === 'test_admin_workforce@keyabroad.com')?.id;

  // Cleanup old records
  await supabaseAdmin.from('team_members').delete().in('email', ['test_emp1_workforce@keyabroad.com', 'test_admin_workforce@keyabroad.com']);

  // Insert Team Members
  await supabaseAdmin.from('team_members').insert([
    { email: 'test_emp1_workforce@keyabroad.com', name: 'Workforce Emp', role: 'normal employee', status: 'active' },
    { email: 'test_admin_workforce@keyabroad.com', name: 'Workforce Admin', role: 'ADMIN', status: 'active' }
  ]);

  const empRes = await supabaseAdmin.from('team_members').select('id').eq('email', 'test_emp1_workforce@keyabroad.com').single();
  const adminRes = await supabaseAdmin.from('team_members').select('id').eq('email', 'test_admin_workforce@keyabroad.com').single();

  const emp1 = empRes.data;
  const adminEmp = adminRes.data;

  if (!emp1 || !adminEmp) {
    console.error("Failed to find inserted team members", empRes.error, adminRes.error);
    process.exit(1);
  }

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

  console.log("\n--- API Security Tests ---");
  const empData = await calculateWorkforceStatus(supabaseAdmin, '2026-09-28', false, emp1.id);
  const adminData = await calculateWorkforceStatus(supabaseAdmin, '2026-09-28', true, adminEmp.id);

  console.log("empData.employees.length", empData.employees?.length);
  console.log("adminData.employees.length", adminData.employees?.length);

  assert("Employee sees only their own workforce data (isolation)", empData.employees?.length === 1 && empData.employees[0].employee_id === emp1.id);
  assert("Admin can access authorized full workforce data", adminData.employees?.length >= 2);

  // --- ENGINE TESTS PREPARATION ---
  console.log("\n--- Engine Logic Tests ---");
  const TARGET_DATE = '2026-10-01';

  await supabaseAdmin.from('shifts').delete().eq('name', 'Workforce Test Shift');

  // 1. Shift: 09:00 - 17:00, 15m grace
  const { data: shift, error: shiftErr } = await supabaseAdmin.from('shifts').insert({
    name: 'Workforce Test Shift',
    start_time: '09:00:00',
    end_time: '17:00:00',
    grace_period_minutes: 15,
    overtime_threshold_minutes: 30
  }).select('id').single();

  if (shiftErr) {
    console.error("Shift insert failed:", shiftErr);
  }

  await supabaseAdmin.from('employee_shifts').insert({
    employee_id: emp1.id,
    shift_id: shift!.id,
    effective_from: '2026-09-01'
  });

  const getEmpStatus = async () => {
    const res = await calculateWorkforceStatus(supabaseAdmin, TARGET_DATE, true, adminEmp.id);
    const found = res.employees.find((e: any) => e.employee_id === emp1.id);
    if (!found) {
      console.log("NOT FOUND in employees list! Full list:", JSON.stringify(res.employees, null, 2));
    }
    return found;
  };

  const insertAttendance = async (data: any) => {
    const { error } = await supabaseAdmin.from('employee_attendance').insert(data);
    if (error) console.error("ATTENDANCE INSERT ERROR:", error);
  };

  // TEST: LATE (inside grace vs after grace)
  // Inside grace
  await supabaseAdmin.from('employee_attendance').delete().eq('employee_id', emp1.id.toString());
  await insertAttendance({
    employee_id: emp1.id.toString(),
    employee_name: 'Workforce Emp',
    date: TARGET_DATE,
    status: 'PRESENT',
    created_at: `${TARGET_DATE}T04:10:00Z`, // 09:10 PKT
    check_out_time: `${TARGET_DATE}T12:00:00Z`, // 17:00 PKT
  });
  let empStatus = await getEmpStatus();
  assert("Grace Period: 09:10 check-in is PRESENT", empStatus?.status === 'PRESENT');

  // After grace (09:20)
  await supabaseAdmin.from('employee_attendance').delete().eq('employee_id', emp1.id.toString());
  await insertAttendance({
    employee_id: emp1.id.toString(),
    employee_name: 'Workforce Emp',
    date: TARGET_DATE,
    status: 'PRESENT',
    created_at: `${TARGET_DATE}T04:20:00Z`, // 09:20 PKT
    check_out_time: `${TARGET_DATE}T12:00:00Z`, // 17:00 PKT
  });
  empStatus = await getEmpStatus();
  assert("LATE: 09:20 check-in is LATE", empStatus?.status === 'LATE' && empStatus?.metrics.late_minutes === 20);

  // EARLY_DEPARTURE (check out 16:30 PKT)
  await supabaseAdmin.from('employee_attendance').delete().eq('employee_id', emp1.id.toString());
  await insertAttendance({
    employee_id: emp1.id.toString(),
    employee_name: 'Workforce Emp',
    date: TARGET_DATE,
    status: 'PRESENT',
    created_at: `${TARGET_DATE}T04:00:00Z`, // 09:00 PKT
    check_out_time: `${TARGET_DATE}T11:30:00Z`, // 16:30 PKT
  });
  empStatus = await getEmpStatus();
  assert("EARLY_DEPARTURE: 16:30 checkout", empStatus?.status === 'EARLY_DEPARTURE' && empStatus?.metrics.early_departure_minutes === 30);

  // OVERTIME (check out 18:00 PKT -> 60m extra, threshold is 30m)
  await supabaseAdmin.from('employee_attendance').delete().eq('employee_id', emp1.id.toString());
  await insertAttendance({
    employee_id: emp1.id.toString(),
    employee_name: 'Workforce Emp',
    date: TARGET_DATE,
    status: 'PRESENT',
    created_at: `${TARGET_DATE}T04:00:00Z`, // 09:00 PKT
    check_out_time: `${TARGET_DATE}T13:00:00Z`, // 18:00 PKT
  });
  empStatus = await getEmpStatus();
  assert("OVERTIME: 60 minutes extra calculated", empStatus?.metrics?.overtime_minutes === 60);

  // INCOMPLETE (missing check-out)
  await supabaseAdmin.from('employee_attendance').delete().eq('employee_id', emp1.id.toString());
  await insertAttendance({
    employee_id: emp1.id.toString(),
    employee_name: 'Workforce Emp',
    date: TARGET_DATE,
    status: 'PRESENT',
    created_at: `${TARGET_DATE}T04:00:00Z`, // 09:00 PKT
  });
  empStatus = await getEmpStatus();
  assert("INCOMPLETE: Missing check out", empStatus?.status === 'PRESENT_INCOMPLETE');

  // ABSENT
  await supabaseAdmin.from('employee_attendance').delete().eq('employee_id', emp1.id.toString());
  empStatus = await getEmpStatus();
  assert("ABSENT: No attendance record", empStatus?.status === 'ABSENT');

  // HOLIDAY
  await supabaseAdmin.from('hr_holidays').insert({
    name: 'National Holiday',
    date: TARGET_DATE,
    is_active: true
  });
  empStatus = await getEmpStatus();
  assert("HOLIDAY: Takes precedence over absent", empStatus?.status === 'HOLIDAY');

  // LEAVE INTEGRATION
  const { data: lt } = await supabaseAdmin.from('leave_types').insert({ name: 'WF Test Leave' }).select('id').single();
  await supabaseAdmin.from('leave_requests').insert({
    employee_id: emp1.id,
    leave_type_id: lt!.id,
    start_date: TARGET_DATE,
    end_date: TARGET_DATE,
    total_days: 1,
    status: 'APPROVED'
  });
  empStatus = await getEmpStatus();
  assert("ON_LEAVE: Approved leave takes precedence", empStatus?.status === 'ON_LEAVE');

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);

  // Cleanup
  await supabaseAdmin.from('employee_shifts').delete().eq('employee_id', emp1.id);
  await supabaseAdmin.from('shifts').delete().eq('name', 'Workforce Test Shift');
  await supabaseAdmin.from('hr_holidays').delete().eq('name', 'National Holiday');
  await supabaseAdmin.from('leave_requests').delete().eq('employee_id', emp1.id);
  await supabaseAdmin.from('leave_types').delete().eq('name', 'WF Test Leave');
  await supabaseAdmin.from('employee_attendance').delete().eq('employee_id', emp1.id.toString());
  await supabaseAdmin.from('team_members').delete().in('email', ['test_emp1_workforce@keyabroad.com', 'test_admin_workforce@keyabroad.com']);
  if (u1Id) await supabaseAdmin.auth.admin.deleteUser(u1Id);
  if (adminId) await supabaseAdmin.auth.admin.deleteUser(adminId);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
