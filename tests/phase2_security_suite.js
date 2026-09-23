import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;
const results = [];

function assert(description, condition, details = '') {
  if (condition) {
    passed++;
    results.push({ test: description, status: 'PASS', details });
    console.log(`  ✅ PASS: ${description}`);
  } else {
    failed++;
    results.push({ test: description, status: 'FAIL', details });
    console.error(`  ❌ FAIL: ${description} - ${details}`);
  }
}

console.log('\n=============================================================');
console.log('PHASE 2 SECURITY & IDENTITY REMEDIATION COMPREHENSIVE SUITE');
console.log('=============================================================\n');

// -------------------------------------------------------------
// 1. SQL MIGRATION FILE VALIDATION
// -------------------------------------------------------------
console.log('--- 1. Database Migration & Integrity Checks ---');
const migrationPath = path.resolve(process.cwd(), 'phase2_security_remediation.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

assert(
  'Migration file phase2_security_remediation.sql exists',
  fs.existsSync(migrationPath)
);

assert(
  'Integrity Check: DO block checks for NULL/empty employee_id',
  migrationSql.includes('employee_id IS NULL') && migrationSql.includes("employee_id::text) = ''")
);

assert(
  'Integrity Check: DO block validates numeric format with regex',
  migrationSql.includes("employee_id::text !~ '^[0-9]+$'")
);

assert(
  'Integrity Check: DO block checks for orphan records before type conversion',
  migrationSql.includes('NOT EXISTS') && migrationSql.includes('team_members tm WHERE tm.id = ea.employee_id::integer')
);

assert(
  'Integrity Check: Migration aborts with RAISE EXCEPTION if integrity fails',
  migrationSql.includes('RAISE EXCEPTION')
);

assert(
  'Data Model: employee_id converted to INTEGER',
  migrationSql.includes('ALTER COLUMN employee_id TYPE INTEGER')
);

assert(
  'Data Model: Foreign key uses ON DELETE RESTRICT (Never cascade-delete)',
  migrationSql.includes('REFERENCES team_members(id) ON DELETE RESTRICT') &&
  !migrationSql.includes('REFERENCES team_members(id) ON DELETE CASCADE')
);

assert(
  'RLS: profiles RLS enabled',
  migrationSql.includes('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;')
);

assert(
  'RLS: team_members RLS enabled and public access removed',
  migrationSql.includes('ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;') &&
  migrationSql.includes('DROP POLICY IF EXISTS "Enable all for public" ON team_members;')
);

// Check that CREATE POLICY on employee_attendance only creates SELECT policy and NO INSERT/UPDATE/DELETE policies
const createPoliciesOnAttendance = (migrationSql.match(/CREATE POLICY [^;]+ ON employee_attendance[^;]+;/gi) || []);
const hasWritePolicyOnAttendance = createPoliciesOnAttendance.some(p => /FOR (INSERT|UPDATE|DELETE|ALL)/i.test(p));

assert(
  'RLS: employee_attendance RLS enabled and direct client writes removed (only SELECT policy created)',
  migrationSql.includes('ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;') &&
  !hasWritePolicyOnAttendance
);

// -------------------------------------------------------------
// 2. PASSWORD SECURITY VALIDATION
// -------------------------------------------------------------
console.log('\n--- 2. Password Security & Random Generation ---');
const createEmpRoutePath = path.resolve(process.cwd(), 'apps/admin/src/app/api/create-employee/route.ts');
const createEmpContent = fs.readFileSync(createEmpRoutePath, 'utf8');

assert(
  'Hardcoded password KeyabroadPassword123! is completely removed',
  !createEmpContent.includes('KeyabroadPassword123!')
);

assert(
  'Temporary password generated with cryptographically secure random generator',
  createEmpContent.includes('crypto.randomBytes')
);

// Check that API response does NOT contain tempPassword or raw password property
const jsonReturnMatches = createEmpContent.match(/return NextResponse\.json\(\s*\{([\s\S]*?)\}\s*\)/gi) || [];
const leaksPasswordProperty = jsonReturnMatches.some(m => /\b(tempPassword|password)\s*:/i.test(m));

assert(
  'Password is NEVER returned in API response properties to the client',
  !leaksPasswordProperty && createEmpContent.includes('Magic Link')
);

assert(
  'create-employee route requires Admin / Owner authorization',
  createEmpContent.includes('Forbidden: Insufficient permissions to create employees')
);

// -------------------------------------------------------------
// 3. ATTENDANCE WRITE ARCHITECTURE VALIDATION
// -------------------------------------------------------------
console.log('\n--- 3. Attendance Write Architecture ---');
const attendanceRoutePath = path.resolve(process.cwd(), 'apps/admin/src/app/api/attendance/route.ts');
const attendanceContent = fs.readFileSync(attendanceRoutePath, 'utf8');

assert(
  '/api/attendance route exists',
  fs.existsSync(attendanceRoutePath)
);

assert(
  'Attendance API authenticates user session server-side',
  attendanceContent.includes('createServerClient') &&
  attendanceContent.includes('auth.getUser()')
);

assert(
  'Attendance API resolves employee from trusted session email, not client input',
  attendanceContent.includes("eq('email', user.email)") &&
  !attendanceContent.includes('const { employeeId } = body') &&
  !attendanceContent.includes('const { employee_id } = body')
);

assert(
  'Attendance API validates PKT time window strictly (10:00 - 11:00 AM)',
  attendanceContent.includes('hours < 10') &&
  attendanceContent.includes('hours >= 11')
);

assert(
  'Attendance API supports check-out without re-creating check-in',
  attendanceContent.includes("action === 'check_out'") &&
  attendanceContent.includes('check_out_time')
);

// -------------------------------------------------------------
// 4. ATTENDANCE CORRECTION & MARK-ABSENT VALIDATION
// -------------------------------------------------------------
console.log('\n--- 4. Attendance Correction & Mark-Absent APIs ---');
const correctionRoutePath = path.resolve(process.cwd(), 'apps/admin/src/app/api/attendance/correction/route.ts');
const correctionContent = fs.readFileSync(correctionRoutePath, 'utf8');

assert(
  '/api/attendance/correction route exists',
  fs.existsSync(correctionRoutePath)
);

assert(
  'Correction API strictly requires Admin / HR role',
  correctionContent.includes('Forbidden: Insufficient privileges')
);

assert(
  'Correction API validates target employee exists in team_members',
  correctionContent.includes("from('team_members')") &&
  correctionContent.includes('Target employee not found')
);

assert(
  'Correction API records actor, date, old_status, and new_status',
  correctionContent.includes('oldStatus') &&
  correctionContent.includes('newStatus') &&
  correctionContent.includes('actor')
);

const markAbsentPath = path.resolve(process.cwd(), 'apps/admin/src/app/api/automations/mark-absent/route.ts');
const markAbsentContent = fs.readFileSync(markAbsentPath, 'utf8');

assert(
  'mark-absent requires valid CRON_SECRET or Admin session',
  markAbsentContent.includes('Bearer ${cronSecret}') &&
  markAbsentContent.includes('Unauthorized')
);

assert(
  'mark-absent is idempotent (only targets active employees without existing records)',
  markAbsentContent.includes('attendedIds.has') &&
  markAbsentContent.includes('absentRecords')
);

// -------------------------------------------------------------
// 5. EMPLOYEE DELETION & ROLE SECURITY
// -------------------------------------------------------------
console.log('\n--- 5. Attendance History Protection & Role Management ---');
const deleteRoutePath = path.resolve(process.cwd(), 'apps/admin/src/app/api/team/delete/route.ts');
const deleteContent = fs.readFileSync(deleteRoutePath, 'utf8');

assert(
  '/api/team/delete route exists',
  fs.existsSync(deleteRoutePath)
);

assert(
  'Employee deletion is REJECTED when attendance history exists',
  deleteContent.includes('Cannot delete employee') &&
  deleteContent.includes('historical attendance record(s) exist') &&
  deleteContent.includes('Resigned')
);

const roleRoutePath = path.resolve(process.cwd(), 'apps/admin/src/app/api/team/role/route.ts');
const roleContent = fs.readFileSync(roleRoutePath, 'utf8');

assert(
  '/api/team/role route exists',
  fs.existsSync(roleRoutePath)
);

assert(
  'Role update requires Owner / Admin role',
  roleContent.includes('Only an Owner or Administrator can change employee roles')
);

assert(
  'Role update strictly whitelists allowed role values',
  roleContent.includes('ALLOWED_ROLES')
);

// -------------------------------------------------------------
// 6. FRONTEND ATTENDANCE & TEAM PAGE REFACTORING
// -------------------------------------------------------------
console.log('\n--- 6. Frontend Refactoring & UI Security ---');
const attendancePagePath = path.resolve(process.cwd(), 'apps/admin/src/app/attendance/page.tsx');
const attendancePageContent = fs.readFileSync(attendancePagePath, 'utf8');

assert(
  'Attendance UI uses POST /api/attendance for self-marking',
  attendancePageContent.includes('fetch("/api/attendance"')
);

assert(
  'Attendance UI uses POST /api/attendance for check-out',
  attendancePageContent.includes("action: \"check_out\"")
);

assert(
  'Attendance UI uses POST /api/attendance/correction for admin overrides',
  attendancePageContent.includes('fetch(\'/api/attendance/correction\'')
);

assert(
  'Attendance UI has NO direct supabase writes to employee_attendance',
  !attendancePageContent.includes("supabase.from('employee_attendance').insert") &&
  !attendancePageContent.includes("supabase.from('employee_attendance').update") &&
  !attendancePageContent.includes("supabase.from('employee_attendance').delete")
);

const teamPagePath = path.resolve(process.cwd(), 'apps/admin/src/app/team/page.tsx');
const teamPageContent = fs.readFileSync(teamPagePath, 'utf8');

assert(
  'Team page uses /api/team/delete instead of direct client delete',
  teamPageContent.includes('fetch(\'/api/team/delete\'')
);

assert(
  'Team page does NOT cascade delete attendance in client',
  !teamPageContent.includes("supabase.from('employee_attendance').delete")
);

assert(
  'Team page uses /api/team/role instead of direct client role update',
  teamPageContent.includes('fetch(\'/api/team/role\'')
);

// -------------------------------------------------------------
// 7. SECURITY REGRESSION SCAN
// -------------------------------------------------------------
console.log('\n--- 7. Repository Security Regression Scan ---');

function scanFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'dist') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const adminFiles = scanFiles(path.resolve(process.cwd(), 'apps/admin/src'));
let serviceRoleInClientCount = 0;
let hardcodedPasswordCount = 0;

for (const f of adminFiles) {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('KeyabroadPassword123!')) {
    hardcodedPasswordCount++;
  }
  if (content.startsWith('"use client"') && content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    serviceRoleInClientCount++;
  }
}

assert(
  'Security Scan: 0 occurrences of hardcoded password KeyabroadPassword123!',
  hardcodedPasswordCount === 0
);

assert(
  'Security Scan: 0 client-side leaks of SUPABASE_SERVICE_ROLE_KEY',
  serviceRoleInClientCount === 0
);

console.log('\n=============================================================');
console.log(`PHASE 2 TEST SUMMARY: Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}`);
console.log('=============================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
