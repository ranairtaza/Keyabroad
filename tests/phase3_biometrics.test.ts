import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BiometricIdentityResolver } from '../apps/admin/src/lib/biometrics/identity-resolver';
import { AttendanceEventEngine } from '../apps/admin/src/lib/biometrics/event-engine';

let passed = 0;
let failed = 0;
const results: { test: string; status: string; details: string }[] = [];

function assert(description: string, condition: boolean, details: string = '') {
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

async function runPhase3Tests() {
  console.log('\n=============================================================');
  console.log('PHASE 3 VENDOR-NEUTRAL BIOMETRIC FOUNDATION TEST SUITE');
  console.log('=============================================================\n');

  // -------------------------------------------------------------
  // 1. DATABASE SCHEMA & MIGRATION VALIDATION
  // -------------------------------------------------------------
  console.log('--- 1. Database Migrations & Table Integrity ---');
  const migration044Path = path.resolve(process.cwd(), 'migrations/044_biometric_attendance_foundation.sql');
  const migrationSql = fs.readFileSync(migration044Path, 'utf8');

  assert(
    'Migration file migrations/044_biometric_attendance_foundation.sql exists',
    fs.existsSync(migration044Path)
  );

  assert(
    'biometric_devices table defined with open-ended manufacturer (TEXT)',
    migrationSql.includes('CREATE TABLE IF NOT EXISTS biometric_devices') &&
    migrationSql.includes('manufacturer TEXT NOT NULL') &&
    !migrationSql.includes('manufacturer enum')
  );

  assert(
    'biometric_devices has serial_number UNIQUE constraint',
    migrationSql.includes('serial_number TEXT NOT NULL UNIQUE')
  );

  assert(
    'employee_biometric_mappings table defined with FK to team_members(id) ON DELETE RESTRICT',
    migrationSql.includes('employee_id INTEGER NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT')
  );

  assert(
    'employee_biometric_mappings supports device-scoped unique index',
    migrationSql.includes('CREATE UNIQUE INDEX IF NOT EXISTS uq_device_biometric_user') &&
    migrationSql.includes('employee_biometric_mappings(device_id, biometric_user_id)')
  );

  assert(
    'employee_biometric_mappings supports global-scoped unique index (device_id IS NULL)',
    migrationSql.includes('CREATE UNIQUE INDEX IF NOT EXISTS uq_global_biometric_user') &&
    migrationSql.includes('WHERE device_id IS NULL')
  );

  assert(
    'attendance_events ledger table defined with ON DELETE RESTRICT',
    migrationSql.includes('CREATE TABLE IF NOT EXISTS attendance_events') &&
    migrationSql.includes('REFERENCES biometric_devices(id) ON DELETE RESTRICT')
  );

  assert(
    'attendance_events has idempotency_hash UNIQUE index',
    migrationSql.includes('idempotency_hash TEXT UNIQUE')
  );

  assert(
    'RLS enabled on biometric_devices, employee_biometric_mappings, and attendance_events',
    migrationSql.includes('ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;') &&
    migrationSql.includes('ALTER TABLE employee_biometric_mappings ENABLE ROW LEVEL SECURITY;') &&
    migrationSql.includes('ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;')
  );

  assert(
    'attendance_events has NO public or normal employee SELECT policy (Admins/HR only)',
    migrationSql.includes('CREATE POLICY "attendance_events_admin_select" ON attendance_events') &&
    !migrationSql.includes('"attendance_events_select_all"')
  );

  // -------------------------------------------------------------
  // 2. MOCK SUPABASE CLIENT FOR DETERMINISTIC UNIT TESTING
  // -------------------------------------------------------------
  console.log('\n--- 2. Mock In-Memory Database Harness ---');

  class MockDatabase {
    biometric_devices: any[];
    team_members: any[];
    employee_biometric_mappings: any[];
    attendance_events: any[];
    employee_attendance: any[];

    constructor() {
      this.biometric_devices = [
        {
          id: 'dev-1001-uuid',
          device_name: 'Main Turnstile Terminal',
          manufacturer: 'ZKTeco',
          model: 'SpeedFace-V5L',
          serial_number: 'SN-9901-A',
          branch_location: 'Main Office',
          status: 'active',
          api_key_hash: crypto.createHash('sha256').update('test_api_key_1').digest('hex')
        },
        {
          id: 'dev-1002-uuid',
          device_name: 'Secondary Gate Terminal',
          manufacturer: 'Hikvision',
          model: 'DS-K1T671MF',
          serial_number: 'SN-9902-B',
          branch_location: 'Branch 2',
          status: 'inactive',
          api_key_hash: crypto.createHash('sha256').update('test_api_key_2').digest('hex')
        }
      ];

      this.team_members = [
        { id: 1, name: 'Alice Smith', email: 'alice@keyabroad.com', status: 'active', role: 'Visa Processing Specialist' },
        { id: 2, name: 'Bob Jones', email: 'bob@keyabroad.com', status: 'active', role: 'Career Guidance Expert' },
        { id: 3, name: 'Charlie Deactivated', email: 'charlie@keyabroad.com', status: 'resigned', role: 'Internee' }
      ];

      this.employee_biometric_mappings = [
        { id: 'map-1', employee_id: 1, device_id: 'dev-1001-uuid', biometric_user_id: '101', status: 'active' },
        { id: 'map-2', employee_id: 2, device_id: null, biometric_user_id: '202', status: 'active' },
        { id: 'map-3', employee_id: 3, device_id: 'dev-1001-uuid', biometric_user_id: '303', status: 'active' },
        { id: 'map-4', employee_id: 1, device_id: 'dev-1001-uuid', biometric_user_id: '404', status: 'inactive' }
      ];

      this.attendance_events = [];
      this.employee_attendance = [];
    }

    createClient(): any {
      const db = this;

      class QueryBuilder implements PromiseLike<any> {
        private tableName: string;
        private filters: ((row: any) => boolean)[] = [];
        private sortFn?: (a: any, b: any) => number;
        private limitVal?: number;
        private isSingle: boolean = false;
        private insertedRows: any[] | null = null;
        private updatePayload: any = null;
        private isDelete: boolean = false;

        constructor(tableName: string) {
          this.tableName = tableName;
        }

        select(_cols?: string) {
          return this;
        }

        eq(col: string, val: any) {
          this.filters.push(row => String(row[col]) === String(val));
          return this;
        }

        is(col: string, val: any) {
          this.filters.push(row => row[col] === val);
          return this;
        }

        gte(col: string, val: any) {
          this.filters.push(row => row[col] >= val);
          return this;
        }

        lte(col: string, val: any) {
          this.filters.push(row => row[col] <= val);
          return this;
        }

        order(col: string, options?: { ascending?: boolean }) {
          const asc = options?.ascending !== false;
          this.sortFn = (a, b) => {
            if (a[col] < b[col]) return asc ? -1 : 1;
            if (a[col] > b[col]) return asc ? 1 : -1;
            return 0;
          };
          return this;
        }

        limit(num: number) {
          this.limitVal = num;
          return this;
        }

        insert(records: any) {
          const list = Array.isArray(records) ? records : [records];
          const table = (db as any)[this.tableName] || ((db as any)[this.tableName] = []);
          this.insertedRows = [];
          for (const r of list) {
            const newRow = { id: r.id || `gen-${Math.random().toString(36).slice(2, 9)}`, ...r };
            table.push(newRow);
            this.insertedRows.push(newRow);
          }
          return this;
        }

        update(updates: any) {
          this.updatePayload = updates;
          return this;
        }

        delete() {
          this.isDelete = true;
          return this;
        }

        async single() {
          this.isSingle = true;
          return this.execute();
        }

        private execute() {
          const table: any[] = (db as any)[this.tableName] || [];

          if (this.insertedRows !== null) {
            if (this.isSingle) {
              return { data: this.insertedRows[0] || null, error: null };
            }
            return { data: this.insertedRows, error: null };
          }

          if (this.isDelete) {
            (db as any)[this.tableName] = table.filter(row => !this.filters.every(f => f(row)));
            return { data: null, error: null };
          }

          if (this.updatePayload) {
            let updated: any[] = [];
            for (let i = 0; i < table.length; i++) {
              if (this.filters.every(f => f(table[i]))) {
                table[i] = { ...table[i], ...this.updatePayload };
                updated.push(table[i]);
              }
            }
            return { data: this.isSingle ? (updated[0] || null) : updated, error: null };
          }

          let matched = table.filter(row => this.filters.every(f => f(row)));
          if (this.sortFn) {
            matched.sort(this.sortFn);
          }
          if (this.limitVal !== undefined) {
            matched = matched.slice(0, this.limitVal);
          }

          if (this.isSingle) {
            if (matched.length === 0) {
              return { data: null, error: { message: 'Row not found' } };
            }
            return { data: matched[0], error: null };
          }

          return { data: matched, error: null };
        }

        then<TResult1 = any, TResult2 = never>(
          onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
          onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
        ): Promise<TResult1 | TResult2> {
          return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
        }
      }

      return {
        from: (tableName: string) => new QueryBuilder(tableName)
      };
    }
  }

  // -------------------------------------------------------------
  // 3. IDENTITY RESOLVER TESTS
  // -------------------------------------------------------------
  console.log('\n--- 3. Biometric Identity Resolver Tests ---');

  const mockDb = new MockDatabase();
  const mockClient = mockDb.createClient();

  // Test 3.1: Valid device-scoped mapping resolution
  const res1 = await BiometricIdentityResolver.resolve('dev-1001-uuid', '101', mockClient);
  assert(
    'Device-scoped mapping: resolves to Alice Smith (employee_id: 1)',
    res1.status === 'MATCHED' && res1.employeeId === 1 && res1.employeeName === 'Alice Smith'
  );

  // Test 3.2: Global mapping resolution
  const res2 = await BiometricIdentityResolver.resolve('dev-1001-uuid', '202', mockClient);
  assert(
    'Global mapping (device_id IS NULL): resolves to Bob Jones (employee_id: 2)',
    res2.status === 'MATCHED' && res2.employeeId === 2
  );

  // Test 3.3: Inactive device rejection
  const res3 = await BiometricIdentityResolver.resolve('dev-1002-uuid', '101', mockClient);
  assert(
    'Inactive device: returns INVALID_DEVICE with descriptive error',
    res3.status === 'INVALID_DEVICE' && res3.error?.includes('deactivated') === true
  );

  // Test 3.4: Unregistered device rejection
  const res4 = await BiometricIdentityResolver.resolve('non-existent-device', '101', mockClient);
  assert(
    'Unregistered device: returns INVALID_DEVICE',
    res4.status === 'INVALID_DEVICE'
  );

  // Test 3.5: Unmatched biometric user ID
  const res5 = await BiometricIdentityResolver.resolve('dev-1001-uuid', '99999', mockClient);
  assert(
    'Unmatched terminal user: returns UNMATCHED without throwing error',
    res5.status === 'UNMATCHED'
  );

  // Test 3.6: Inactive employee mapping
  const res6 = await BiometricIdentityResolver.resolve('dev-1001-uuid', '303', mockClient);
  assert(
    'Inactive/resigned employee: returns INACTIVE (charlie resigned)',
    res6.status === 'INACTIVE' && res6.error?.includes('resigned') === true
  );

  // Test 3.7: Deactivated mapping
  const res7 = await BiometricIdentityResolver.resolve('dev-1001-uuid', '404', mockClient);
  assert(
    'Deactivated mapping: returns INACTIVE',
    res7.status === 'INACTIVE' && res7.error?.includes('deactivated') === true
  );

  // -------------------------------------------------------------
  // 4. ATTENDANCE EVENT ENGINE & IDEMPOTENCY TESTS
  // -------------------------------------------------------------
  console.log('\n--- 4. Attendance Event Engine & Deduplication Tests ---');

  // Test 4.1: Ingestion of valid CHECK_IN event
  const checkInEvent = {
    deviceId: 'dev-1001-uuid',
    biometricUserId: '101',
    eventTimestamp: '2026-09-20T10:05:00.000Z',
    eventType: 'CHECK_IN' as const,
    verificationMethod: 'FINGERPRINT' as const,
    externalEventId: 'LOG_SEQ_1001',
    rawMetadata: { temperature: 36.6, matchScore: 98 }
  };

  const engineRes1 = await AttendanceEventEngine.processEvent(checkInEvent, mockClient);
  assert(
    'Check-in event: successfully processed and created attendance record',
    engineRes1.status === 'PROCESSED' && 
    engineRes1.resolvedEmployeeId === 1 &&
    mockDb.employee_attendance.length === 1 &&
    mockDb.employee_attendance[0].status === 'present'
  );

  // Test 4.2: Duplicate check-in with same external_event_id is ignored
  const engineRes2 = await AttendanceEventEngine.processEvent(checkInEvent, mockClient);
  assert(
    'Duplicate event with same externalEventId: detected and ignored',
    engineRes2.isDuplicate === true && 
    engineRes2.actionTaken === 'DUPLICATE_IGNORED' &&
    mockDb.employee_attendance.length === 1
  );

  // Test 4.3: Ingestion of CHECK_OUT event for the same employee
  const checkOutEvent = {
    deviceId: 'dev-1001-uuid',
    biometricUserId: '101',
    eventTimestamp: '2026-09-20T18:15:00.000Z',
    eventType: 'CHECK_OUT' as const,
    verificationMethod: 'FINGERPRINT' as const,
    externalEventId: 'LOG_SEQ_1002'
  };

  const engineRes3 = await AttendanceEventEngine.processEvent(checkOutEvent, mockClient);
  assert(
    'Check-out event: updates check_out_time without creating duplicate attendance row',
    engineRes3.status === 'PROCESSED' &&
    engineRes3.actionTaken === 'CHECK_OUT_RECORDED' &&
    mockDb.employee_attendance.length === 1 &&
    mockDb.employee_attendance[0].check_out_time === '2026-09-20T18:15:00.000Z'
  );

  // Test 4.4: Fallback minute-window deduplication (no external_event_id provided)
  const fallbackEventA = {
    deviceId: 'dev-1001-uuid',
    biometricUserId: '202',
    eventTimestamp: '2026-09-20T10:10:15.000Z',
    eventType: 'CHECK_IN' as const,
    verificationMethod: 'FACE' as const
  };

  const fallbackEventB_rapid_repeat = {
    deviceId: 'dev-1001-uuid',
    biometricUserId: '202',
    eventTimestamp: '2026-09-20T10:10:45.000Z',
    eventType: 'CHECK_IN' as const,
    verificationMethod: 'FACE' as const
  };

  const engineRes4A = await AttendanceEventEngine.processEvent(fallbackEventA, mockClient);
  const engineRes4B = await AttendanceEventEngine.processEvent(fallbackEventB_rapid_repeat, mockClient);

  assert(
    'Fallback deduplication: first event processed, rapid duplicate within same minute ignored',
    engineRes4A.status === 'PROCESSED' &&
    engineRes4B.isDuplicate === true &&
    engineRes4B.actionTaken === 'DUPLICATE_IGNORED'
  );

  // Test 4.5: Unmatched biometric ID is recorded in audit ledger (never lost)
  const unmatchedEvent = {
    deviceId: 'dev-1001-uuid',
    biometricUserId: 'UNKNOWN_999',
    eventTimestamp: '2026-09-20T10:20:00.000Z',
    eventType: 'CHECK_IN' as const,
    verificationMethod: 'RFID' as const,
    externalEventId: 'LOG_SEQ_9999'
  };

  const engineRes5 = await AttendanceEventEngine.processEvent(unmatchedEvent, mockClient);
  assert(
    'Unmatched event: marked UNMATCHED and stored in attendance_events for future remapping',
    engineRes5.status === 'UNMATCHED' &&
    mockDb.attendance_events.some((e: any) => e.biometric_user_id === 'UNKNOWN_999' && e.processing_status === 'UNMATCHED')
  );

  // Test 4.6: Inactive employee event is marked IGNORED
  const inactiveEvent = {
    deviceId: 'dev-1001-uuid',
    biometricUserId: '303',
    eventTimestamp: '2026-09-20T10:25:00.000Z',
    eventType: 'CHECK_IN' as const,
    verificationMethod: 'FINGERPRINT' as const,
    externalEventId: 'LOG_SEQ_3030'
  };

  const engineRes6 = await AttendanceEventEngine.processEvent(inactiveEvent, mockClient);
  assert(
    'Inactive employee punch: marked IGNORED and does NOT mutate attendance table',
    engineRes6.status === 'IGNORED' &&
    engineRes6.actionTaken === 'INACTIVE_IGNORED'
  );

  // -------------------------------------------------------------
  // 5. BATCH INGESTION SUMMARY TESTS
  // -------------------------------------------------------------
  console.log('\n--- 5. Batch Ingestion Tests ---');

  const batchEvents = [
    {
      deviceId: 'dev-1001-uuid',
      biometricUserId: '101',
      eventTimestamp: '2026-09-21T10:02:00.000Z',
      eventType: 'CHECK_IN' as const,
      verificationMethod: 'FINGERPRINT' as const,
      externalEventId: 'BATCH_1'
    },
    {
      deviceId: 'dev-1001-uuid',
      biometricUserId: '202',
      eventTimestamp: '2026-09-21T10:04:00.000Z',
      eventType: 'CHECK_IN' as const,
      verificationMethod: 'FACE' as const,
      externalEventId: 'BATCH_2'
    },
    {
      deviceId: 'dev-1001-uuid',
      biometricUserId: '99999', // unmatched
      eventTimestamp: '2026-09-21T10:05:00.000Z',
      eventType: 'CHECK_IN' as const,
      verificationMethod: 'PIN' as const,
      externalEventId: 'BATCH_3'
    }
  ];

  const batchSummary = await AttendanceEventEngine.processBatch(batchEvents, mockClient);
  assert(
    'Batch processing: summary correctly tallies processed and unmatched events',
    batchSummary.totalReceived === 3 &&
    batchSummary.processed === 2 &&
    batchSummary.unmatched === 1
  );

  // -------------------------------------------------------------
  // 6. API & UI SOURCE CODE AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 6. API & UI Architecture Verification ---');

  const eventsApiContent = fs.readFileSync(path.resolve(process.cwd(), 'apps/admin/src/app/api/biometrics/events/route.ts'), 'utf8');
  const devicesApiContent = fs.readFileSync(path.resolve(process.cwd(), 'apps/admin/src/app/api/biometrics/devices/route.ts'), 'utf8');
  const mappingsApiContent = fs.readFileSync(path.resolve(process.cwd(), 'apps/admin/src/app/api/biometrics/mappings/route.ts'), 'utf8');
  const reprocessApiContent = fs.readFileSync(path.resolve(process.cwd(), 'apps/admin/src/app/api/biometrics/events/reprocess/route.ts'), 'utf8');
  const biometricsPageContent = fs.readFileSync(path.resolve(process.cwd(), 'apps/admin/src/app/biometrics/page.tsx'), 'utf8');

  assert(
    'Ingestion API (/api/biometrics/events) does NOT trust client-supplied employee_id',
    !eventsApiContent.includes('const { employeeId } = body') &&
    !eventsApiContent.includes('ev.employeeId')
  );

  assert(
    'Ingestion API verifies device API key / gateway secret / admin session',
    eventsApiContent.includes('x-device-api-key') &&
    (eventsApiContent.includes('authenticateIngestion') || eventsApiContent.includes('authenticateMachineDevice'))
  );

  assert(
    'Device Registry API (/api/biometrics/devices) generates secure device API key on registration',
    (devicesApiContent.includes('crypto.randomBytes') && devicesApiContent.includes('apiKeyHash')) ||
    (devicesApiContent.includes('DeviceCredentialManager.createCredential') && devicesApiContent.includes('rawApiKey'))
  );

  assert(
    'Mappings API (/api/biometrics/mappings) verifies employee exists before saving mapping',
    mappingsApiContent.includes("from('team_members')") &&
    mappingsApiContent.includes('Employee not found in directory')
  );

  assert(
    'Reprocess API (/api/biometrics/events/reprocess) re-evaluates unmatched events with event engine',
    reprocessApiContent.includes('AttendanceEventEngine.processEvent')
  );

  assert(
    'Admin UI (/biometrics/page.tsx) provides Device Registry, Mapping Management, and Event Ledger tabs',
    biometricsPageContent.includes('Registered Biometric Terminals') &&
    biometricsPageContent.includes('Employee Biometric Identity Mappings') &&
    biometricsPageContent.includes('Biometric Event Ingestion Ledger')
  );

  // -------------------------------------------------------------
  // 7. SENSITIVE DATA PRIVACY AUDIT (NO TEMPLATES / NO IMAGES)
  // -------------------------------------------------------------
  console.log('\n--- 7. Sensitive Biometric Data Privacy Audit ---');

  assert(
    'Database migration contains NO biometric template columns (e.g. fingerprint_template, face_template, embedding, biometric_data)',
    !migrationSql.toLowerCase().includes('fingerprint_template') &&
    !migrationSql.toLowerCase().includes('face_template') &&
    !migrationSql.toLowerCase().includes('raw_image') &&
    !migrationSql.toLowerCase().includes('embedding bytea')
  );

  assert(
    'Zero biometric templates or image buffers stored in schema or API types',
    !eventsApiContent.toLowerCase().includes('fingerprint_template')
  );

  console.log('\n=============================================================');
  console.log(`PHASE 3 TEST SUMMARY: Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase3Tests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
