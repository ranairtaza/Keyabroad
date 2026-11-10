import { DatabaseSync } from 'node:sqlite';

console.log('=== KeyAbroad Phase 0: Isolated Database Engine Integration Test ===');
const db = new DatabaseSync(':memory:');

// 1. Initialize schema matching public.profiles
db.exec(`
  CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'student',
    staff_role TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    updated_at TEXT
  );

  CREATE TABLE session_context (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  INSERT INTO session_context (key, value) VALUES ('current_user', 'authenticated');

  INSERT INTO profiles (id, role, staff_role, is_active, full_name, phone, avatar_url)
  VALUES ('std-1', 'student', NULL, 1, 'Alice Student', '+1234567890', 'https://example.com/alice.png');
`);

console.log('✔ Schema initialized in memory database.');

// 2. Apply Forward Migration (defense-in-depth trigger)
db.exec(`
  CREATE TRIGGER trg_protect_profile_privileged_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (
    OLD.staff_role IS NOT NEW.staff_role OR
    OLD.role IS NOT NEW.role OR
    OLD.is_active IS NOT NEW.is_active
  )
  BEGIN
    SELECT CASE
      WHEN (SELECT value FROM session_context WHERE key = 'current_user') != 'service_role'
      THEN RAISE(ABORT, '42501: Access Denied: Mutating privileged profile attributes (role, staff_role, is_active) is restricted to service administrators.')
    END;
  END;
`);

console.log('✔ Trigger trg_protect_profile_privileged_fields applied.');

let results = [];

// TEST 1: Unauthorized student attempts role escalation to admin
try {
  db.exec("UPDATE profiles SET role = 'admin' WHERE id = 'std-1'");
  results.push({ test: 'Student update role', passed: false, detail: 'Failed to block unauthorized role update' });
} catch (err) {
  results.push({ test: 'Student update role', passed: true, detail: err.message });
}

// TEST 2: Unauthorized student attempts staff_role escalation
try {
  db.exec("UPDATE profiles SET staff_role = 'super_admin' WHERE id = 'std-1'");
  results.push({ test: 'Student update staff_role', passed: false, detail: 'Failed to block unauthorized staff_role update' });
} catch (err) {
  results.push({ test: 'Student update staff_role', passed: true, detail: err.message });
}

// TEST 3: Unauthorized student attempts to tamper with is_active
try {
  db.exec("UPDATE profiles SET is_active = 0 WHERE id = 'std-1'");
  results.push({ test: 'Student update is_active', passed: false, detail: 'Failed to block unauthorized is_active update' });
} catch (err) {
  results.push({ test: 'Student update is_active', passed: true, detail: err.message });
}

// TEST 4: Authorized student updates approved profile fields (full_name, phone, avatar_url)
try {
  db.exec("UPDATE profiles SET full_name = 'Alice Johnson', phone = '+9876543210', avatar_url = 'https://example.com/alice2.png' WHERE id = 'std-1'");
  const updatedRow = db.prepare("SELECT full_name, phone, avatar_url, role, staff_role, is_active FROM profiles WHERE id = ?").get('std-1');
  if (updatedRow.full_name === 'Alice Johnson' && updatedRow.phone === '+9876543210' && updatedRow.role === 'student') {
    results.push({ test: 'Student update approved columns', passed: true, detail: JSON.stringify(updatedRow) });
  } else {
    results.push({ test: 'Student update approved columns', passed: false, detail: 'Row values mismatch' });
  }
} catch (err) {
  results.push({ test: 'Student update approved columns', passed: false, detail: err.message });
}

// TEST 5: Authorized service_role operations continue working
try {
  db.exec("UPDATE session_context SET value = 'service_role' WHERE key = 'current_user'");
  db.exec("UPDATE profiles SET role = 'admin', staff_role = 'super_admin', is_active = 1 WHERE id = 'std-1'");
  const adminRow = db.prepare("SELECT role, staff_role FROM profiles WHERE id = ?").get('std-1');
  if (adminRow.role === 'admin' && adminRow.staff_role === 'super_admin') {
    results.push({ test: 'Service role administrative update', passed: true, detail: JSON.stringify(adminRow) });
  } else {
    results.push({ test: 'Service role administrative update', passed: false, detail: 'Admin row values mismatch' });
  }
} catch (err) {
  results.push({ test: 'Service role administrative update', passed: false, detail: err.message });
}

// Switch back to authenticated session
db.exec("UPDATE session_context SET value = 'authenticated' WHERE key = 'current_user'");

// TEST 6: Rollback / Recovery Safety Test
// Apply recovery procedure: recreate trigger with security invariants intact
db.exec(`
  DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields;

  CREATE TRIGGER trg_protect_profile_privileged_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (
    OLD.staff_role IS NOT NEW.staff_role OR
    OLD.role IS NOT NEW.role OR
    OLD.is_active IS NOT NEW.is_active
  )
  BEGIN
    SELECT CASE
      WHEN (SELECT value FROM session_context WHERE key = 'current_user') != 'service_role'
      THEN RAISE(ABORT, '42501: Access Denied: Mutating privileged profile attributes (role, staff_role, is_active) is restricted to service administrators.')
    END;
  END;
`);

try {
  db.exec("UPDATE profiles SET role = 'hacker' WHERE id = 'std-1'");
  results.push({ test: 'Post-recovery unauthorized update blocked', passed: false, detail: 'Failed to block post-recovery update' });
} catch (err) {
  results.push({ test: 'Post-recovery unauthorized update blocked', passed: true, detail: err.message });
}

// Print results summary
console.log('\n--- Database Execution Results ---');
let allPassed = true;
for (const r of results) {
  const icon = r.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | ${r.test} => ${r.detail}`);
  if (!r.passed) allPassed = false;
}

if (!allPassed) {
  console.error('\nDatabase integration testing FAILED.');
  process.exit(1);
} else {
  console.log('\nAll isolated database integration tests PASSED successfully.');
}

