import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DeviceCredentialManager } from '../apps/admin/src/lib/biometrics/gateway/credentials';
import { GenericBiometricAdapter } from '../apps/admin/src/lib/biometrics/gateway/adapter';
import { computeDeviceHealth } from '../apps/admin/src/lib/biometrics/gateway/health';
import { BiometricIdentityResolver } from '../apps/admin/src/lib/biometrics/identity-resolver';
import { AttendanceEventEngine } from '../apps/admin/src/lib/biometrics/event-engine';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    testsFailed++;
  }
}

async function runPhase4Tests() {
  console.log('\n======================================================');
  console.log('KEYABROAD PHASE 4: SECURE GATEWAY & AUTH TEST SUITE');
  console.log('======================================================\n');

  // ---------------------------------------------------------
  // 1. DEVICE CREDENTIAL LIFECYCLE & HASHING
  // ---------------------------------------------------------
  console.log('--- 1. Device Credential Management & Token Security ---');

  const rawKey = DeviceCredentialManager.generateRawApiKey();
  assert(rawKey.startsWith('ka_dev_'), 'Raw API key begins with ka_dev_ prefix');
  assert(rawKey.length >= 40, 'Raw API key has sufficient cryptographic entropy length');

  const keyPrefix = DeviceCredentialManager.extractPrefix(rawKey);
  assert(keyPrefix.startsWith('ka_dev_') && keyPrefix.length <= 16, 'Prefix extraction formats safely');

  const keyHash = DeviceCredentialManager.hashKey(rawKey);
  assert(keyHash.length === 64, 'SHA-256 hash is 64 hex characters');

  // Verify hash matches independent sha256
  const manualHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  assert(keyHash === manualHash, 'Credential manager uses standard SHA-256 hashing');

  // Mock DB Store for credential testing
  const mockCredentialsTable: any[] = [];
  const mockDevicesTable: any[] = [
    { id: 'dev-001', device_name: 'Main Turnstile', status: 'active', error_count: 0 },
    { id: 'dev-002', device_name: 'Secondary Gate', status: 'active', error_count: 0 },
    { id: 'dev-disabled', device_name: 'Disabled Gate', status: 'inactive', error_count: 0 }
  ];

  function createMockQueryBuilder(table: string) {
    let filters: Array<{ col: string; val: any }> = [];
    let updatePayload: any = null;

    const builder: any = {
      select: () => builder,
      eq: (col: string, val: any) => {
        filters.push({ col, val });
        return builder;
      },
      single: async () => {
        let items: any[] = [];
        if (table === 'device_credentials') {
          items = mockCredentialsTable;
        } else if (table === 'biometric_devices') {
          items = mockDevicesTable;
        }
        for (const f of filters) {
          items = items.filter(item => item[f.col] === f.val);
        }
        const item = items[0] || null;
        return { data: item ? { ...item } : null, error: item ? null : { message: 'Not found' } };
      },
      insert: (record: any) => ({
        select: () => ({
          single: async () => {
            const inserted = {
              id: `cred-${mockCredentialsTable.length + 1}`,
              ...record,
              created_at: new Date().toISOString()
            };
            mockCredentialsTable.push(inserted);
            return { data: { ...inserted }, error: null };
          }
        })
      }),
      update: (updates: any) => {
        updatePayload = updates;
        const updateBuilder: any = {
          eq: (col: string, val: any) => {
            filters.push({ col, val });
            return updateBuilder;
          },
          select: () => updateBuilder,
          single: async () => {
            let targetList = table === 'device_credentials' ? mockCredentialsTable : mockDevicesTable;
            let match = targetList.find(item => filters.every(f => item[f.col] === f.val));
            if (match && updatePayload) {
              Object.assign(match, updatePayload);
            }
            return { data: match ? { ...match } : null, error: match ? null : { message: 'Not found' } };
          },
          then: (resolve: any) => {
            let targetList = table === 'device_credentials' ? mockCredentialsTable : mockDevicesTable;
            let matches = targetList.filter(item => filters.every(f => item[f.col] === f.val));
            for (const match of matches) {
              if (updatePayload) Object.assign(match, updatePayload);
            }
            return resolve({ data: matches, error: null });
          }
        };
        return updateBuilder;
      }
    };

    return builder;
  }

  const mockSupabase: any = {
    from: (table: string) => createMockQueryBuilder(table)
  };

  // Create credential
  const credResult = await DeviceCredentialManager.createCredential('dev-001', 'Primary Key', 'usr-admin-uuid-1234', mockSupabase);
  assert(credResult.deviceId === 'dev-001', 'Credential created with correct deviceId');
  assert(credResult.rawApiKey.startsWith('ka_dev_'), 'Raw API key returned upon creation');
  assert(mockCredentialsTable.length === 1, 'Credential persisted in mock database');
  assert(mockCredentialsTable[0].created_by === 'usr-admin-uuid-1234', 'Actor identity stored from server session UUID');
  assert(mockCredentialsTable[0].key_hash !== credResult.rawApiKey, 'Credential stored exclusively as hash (zero plaintext storage)');

  // Verify valid credential
  const authValid = await DeviceCredentialManager.verifyCredential(credResult.rawApiKey, mockSupabase);
  assert(authValid.authenticated === true, 'Authentication succeeds with valid raw key');
  assert(authValid.deviceId === 'dev-001', 'Authentication resolves correct device ID');

  // Verify invalid key returns generic masked error
  const authInvalid = await DeviceCredentialManager.verifyCredential('ka_dev_invalidsecret1234567890', mockSupabase);
  assert(authInvalid.authenticated === false, 'Authentication fails with wrong key');
  assert(authInvalid.error?.includes('Unauthorized'), 'Generic error returned for wrong key (no internal leak)');

  // Verify malformed key (no prefix) returns generic masked error
  const authMalformed = await DeviceCredentialManager.verifyCredential('malformed_token', mockSupabase);
  assert(authMalformed.authenticated === false, 'Authentication fails with malformed token prefix');

  // Test disabled device cannot ingest
  const disabledCred = await DeviceCredentialManager.createCredential('dev-disabled', 'Disabled Key', 'usr-admin-uuid', mockSupabase);
  const authDisabled = await DeviceCredentialManager.verifyCredential(disabledCred.rawApiKey, mockSupabase);
  assert(authDisabled.authenticated === false, 'Disabled device cannot authenticate');

  // Test Key Rotation with grace period
  const rotationResult = await DeviceCredentialManager.rotateCredential('dev-001', 'Rotated Key', 24, 'usr-admin-uuid-1234', mockSupabase);
  assert(rotationResult.rawApiKey !== credResult.rawApiKey, 'Rotated credential generates distinct raw key');
  assert(mockCredentialsTable.length === 3, 'New credential created alongside grace-period key');

  // Verify new key authenticates
  const authNewKey = await DeviceCredentialManager.verifyCredential(rotationResult.rawApiKey, mockSupabase);
  assert(authNewKey.authenticated === true, 'Rotated key authenticates successfully');

  // Revoke credential
  await DeviceCredentialManager.revokeCredential(credResult.credentialId, 'usr-admin-uuid-1234', mockSupabase);
  assert(mockCredentialsTable[0].status === 'revoked', 'Revoked credential status updated to revoked');

  // Verify revoked key is rejected
  const authRevoked = await DeviceCredentialManager.verifyCredential(credResult.rawApiKey, mockSupabase);
  assert(authRevoked.authenticated === false, 'Revoked credential immediately rejected');

  // Test Expired Credential rejection
  const expiredCred = await DeviceCredentialManager.createCredential('dev-002', 'Expiring Key', 'usr-admin-uuid', mockSupabase, {
    expiresAt: new Date(Date.now() - 60000) // Expired 1 min ago
  });
  const authExpired = await DeviceCredentialManager.verifyCredential(expiredCred.rawApiKey, mockSupabase);
  assert(authExpired.authenticated === false, 'Expired credential cannot authenticate');

  // ---------------------------------------------------------
  // 2. GENERIC BIOMETRIC ADAPTER & ZERO-TEMPLATE DEFENSE
  // ---------------------------------------------------------
  console.log('\n--- 2. GenericBiometricAdapter Validation & Zero-Template Defense ---');

  const validPayload = {
    deviceId: 'dev-001',
    biometricUserId: '101',
    eventTimestamp: new Date().toISOString(),
    eventType: 'CHECK_IN',
    verificationMethod: 'FINGERPRINT'
  };

  const validValidation = GenericBiometricAdapter.validate(validPayload);
  assert(validValidation.valid === true, 'Valid biometric event passes adapter validation');

  const batchPayload = [
    { deviceId: 'dev-001', biometricUserId: '101', eventTimestamp: new Date().toISOString(), eventType: 'CHECK_IN' },
    { deviceId: 'dev-001', biometricUserId: '102', eventTimestamp: new Date().toISOString(), eventType: 'CHECK_OUT' }
  ];
  const batchValidation = GenericBiometricAdapter.validate(batchPayload);
  assert(batchValidation.valid === true, 'Batch of valid events passes adapter validation');

  // Size limit checks
  const hugePayload = {
    ...validPayload,
    metadata: { junk: 'x'.repeat(70000) }
  };
  const sizeValidation = GenericBiometricAdapter.validate(hugePayload);
  assert(sizeValidation.valid === false, 'Payload exceeding 64KB is rejected');
  assert(sizeValidation.errors.some(e => e.includes('64KB')), 'Rejection error clarifies 64KB limit');

  // Forbidden Biometric Template Tests
  const forbiddenKeys = [
    'fingerprint_template',
    'face_template',
    'template_base64',
    'bio_data',
    'facial_feature_vector',
    'minutiae',
    'iris_data',
    'palm_template',
    'fingerprint_image',
    'face_image'
  ];

  for (const forbiddenKey of forbiddenKeys) {
    const maliciousPayload = {
      ...validPayload,
      [forbiddenKey]: 'AAAA...binary_template_data...ZZZZ'
    };
    const res = GenericBiometricAdapter.validate(maliciousPayload);
    assert(res.valid === false, `Adapter explicitly rejects forbidden field '${forbiddenKey}'`);
    assert(res.errors.some(e => e.includes('TEMPLATE REJECTION')), `Error clarifies template rejection for '${forbiddenKey}'`);
  }

  // Nested forbidden template in metadata
  const nestedMaliciousPayload = {
    ...validPayload,
    metadata: {
      terminal_info: {
        raw_fingerprint_template: 'raw_data_sample'
      }
    }
  };
  const nestedRes = GenericBiometricAdapter.validate(nestedMaliciousPayload);
  assert(nestedRes.valid === false, 'Adapter recursively inspects and rejects nested biometric template fields');

  // Timestamp reasonableness checks
  const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const futureValidation = GenericBiometricAdapter.validate({ ...validPayload, eventTimestamp: futureDate });
  assert(futureValidation.valid === false, 'Adapter rejects event timestamp > 24 hours in future');

  const ancientDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
  const ancientValidation = GenericBiometricAdapter.validate({ ...validPayload, eventTimestamp: ancientDate });
  assert(ancientValidation.valid === false, 'Adapter rejects event timestamp > 365 days in past');

  // Normalization: Stripping client-supplied employee_id to prevent spoofing
  const spoofPayload = {
    device_id: 'dev-001',
    pin: '504',
    time: new Date().toISOString(),
    type: 'CHECK_IN',
    employee_id: 9999, // Attempted spoof
    employee_email: 'ceo@example.com',
    role: 'admin'
  };
  const normalizedSpoof = GenericBiometricAdapter.normalize(spoofPayload, 'dev-001');
  assert(normalizedSpoof.length === 1, 'Normalized spoof payload produces 1 event');
  assert((normalizedSpoof[0] as any).employee_id === undefined, 'Client-supplied employee_id is stripped and never trusted');
  assert((normalizedSpoof[0] as any).role === undefined, 'Client-supplied role is stripped');

  // ---------------------------------------------------------
  // 3. DETERMINISTIC DEVICE HEALTH COMPUTATION
  // ---------------------------------------------------------
  console.log('\n--- 3. Deterministic Device Health Computation ---');

  const now = new Date();

  // DISABLED state
  const disabledDev = computeDeviceHealth({ status: 'inactive' }, now);
  assert(disabledDev.state === 'DISABLED', 'Device with status inactive computes to DISABLED');

  // ERROR state
  const errorDev1 = computeDeviceHealth({ status: 'error' }, now);
  assert(errorDev1.state === 'ERROR', 'Device with status error computes to ERROR');

  const errorDev2 = computeDeviceHealth({ status: 'active', consecutive_error_count: 6 }, now);
  assert(errorDev2.state === 'ERROR', 'Device with consecutive_error_count >= 5 computes to ERROR');

  // NEVER_CONNECTED state (newly registered device with null timestamps)
  const neverDev = computeDeviceHealth({ status: 'active', last_heartbeat: null, last_event_at: null, last_authenticated_at: null, last_sync: null }, now);
  assert(neverDev.state === 'NEVER_CONNECTED', 'Newly registered device with null timestamps is strictly NEVER_CONNECTED');

  // ONLINE state (activity within 15 min threshold)
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const onlineDev = computeDeviceHealth({
    status: 'active',
    last_event_at: fiveMinAgo,
    offline_threshold_minutes: 15
  }, now);
  assert(onlineDev.state === 'ONLINE', 'Device with activity within 15 minutes computes to ONLINE');

  // OFFLINE state (last activity 30 min ago, threshold 15 min)
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const offlineDev = computeDeviceHealth({
    status: 'active',
    last_event_at: thirtyMinAgo,
    offline_threshold_minutes: 15
  }, now);
  assert(offlineDev.state === 'OFFLINE', 'Device with activity beyond threshold computes to OFFLINE');

  // ---------------------------------------------------------
  // 4. DATABASE IDEMPOTENCY & MULTI-DEVICE EVENT ID TESTS
  // ---------------------------------------------------------
  console.log('\n--- 4. Database-Level Idempotency & Multi-Device Isolation ---');

  // Verify same externalEventId on two DIFFERENT devices is allowed
  const engineMockDb: any = {
    attendance_events: [],
    employee_biometric_mappings: [
      { id: 'm1', employee_id: 1, biometric_user_id: '101', status: 'active', device_id: 'dev-001' },
      { id: 'm2', employee_id: 2, biometric_user_id: '101', status: 'active', device_id: 'dev-002' }
    ],
    team_members: [
      { id: 1, name: 'Alice', status: 'active' },
      { id: 2, name: 'Bob', status: 'active' }
    ],
    biometric_devices: [
      { id: 'dev-001', device_name: 'Device A', status: 'active' },
      { id: 'dev-002', device_name: 'Device B', status: 'active' }
    ],
    employee_attendance: []
  };

  const engineMockClient: any = {
    from: (table: string) => ({
      select: (fields: string) => ({
        eq: (col1: string, val1: any) => ({
          eq: (col2: string, val2: any) => ({
            single: async () => {
              const list = engineMockDb[table] || [];
              const item = list.find((x: any) => x[col1] === val1 && x[col2] === val2);
              return { data: item || null, error: item ? null : { message: 'Not found' } };
            }
          }),
          single: async () => {
            const list = engineMockDb[table] || [];
            const item = list.find((x: any) => x[col1] === val1);
            return { data: item || null, error: item ? null : { message: 'Not found' } };
          },
          then: (res: any) => {
            const list = engineMockDb[table] || [];
            const items = list.filter((x: any) => x[col1] === val1);
            return res({ data: items, error: null });
          }
        }),
        is: (col: string, val: any) => ({
          eq: (col2: string, val2: any) => ({
            single: async () => {
              const list = engineMockDb[table] || [];
              const item = list.find((x: any) => x[col] === null && x[col2] === val2);
              return { data: item || null, error: item ? null : { message: 'Not found' } };
            }
          })
        })
      }),
      insert: (record: any) => {
        const item = { id: `item-${Date.now()}-${Math.random()}`, ...record };
        if (!engineMockDb[table]) engineMockDb[table] = [];
        engineMockDb[table].push(item);
        return {
          select: () => ({
            single: async () => ({ data: item, error: null })
          })
        };
      },
      update: (updates: any) => ({
        eq: (col: string, val: any) => ({
          select: () => ({
            single: async () => {
              const list = engineMockDb[table] || [];
              const match = list.find((x: any) => x[col] === val);
              if (match) Object.assign(match, updates);
              return { data: match || null, error: null };
            }
          }),
          then: (res: any) => {
            const list = engineMockDb[table] || [];
            const match = list.find((x: any) => x[col] === val);
            if (match) Object.assign(match, updates);
            return res({ data: match ? [match] : [], error: null });
          }
        })
      })
    })
  };

  // Device A sends externalEventId 'SEQ-100'
  const eventDevA = {
    deviceId: 'dev-001',
    biometricUserId: '101',
    eventTimestamp: '2026-09-21T14:30:00.000Z',
    eventType: 'CHECK_IN' as const,
    verificationMethod: 'FINGERPRINT' as const,
    externalEventId: 'SEQ-100'
  };

  const resA = await AttendanceEventEngine.processEvent(eventDevA, engineMockClient);
  assert(resA.status === 'PROCESSED', 'Device A event with SEQ-100 processed successfully');

  // Device B sends the SAME externalEventId 'SEQ-100' (Different physical terminal)
  const eventDevB = {
    deviceId: 'dev-002',
    biometricUserId: '101',
    eventTimestamp: '2026-09-21T14:35:00.000Z',
    eventType: 'CHECK_IN' as const,
    verificationMethod: 'FINGERPRINT' as const,
    externalEventId: 'SEQ-100'
  };

  const resB = await AttendanceEventEngine.processEvent(eventDevB, engineMockClient);
  assert(resB.status === 'PROCESSED', 'Device B event with same SEQ-100 is processed independently without clashing');

  // Duplicate replay from Device A with SEQ-100 is detected and ignored
  const resADup = await AttendanceEventEngine.processEvent(eventDevA, engineMockClient);
  assert(resADup.isDuplicate === true, 'Duplicate event from same device (Device A + SEQ-100) is ignored by idempotency');

  // ---------------------------------------------------------
  // 5. SECURITY SCAN: NO HARDCODED EMAILS & SEPARATED AUTH
  // ---------------------------------------------------------
  console.log('\n--- 5. Source Code Audit: RBAC & Separated Machine Auth ---');

  const eventsRouteSrc = fs.readFileSync(path.resolve(process.cwd(), 'apps/admin/src/app/api/biometrics/events/route.ts'), 'utf8');
  const devicesRouteSrc = fs.readFileSync(path.resolve(process.cwd(), 'apps/admin/src/app/api/biometrics/devices/route.ts'), 'utf8');
  const migration045Src = fs.readFileSync(path.resolve(process.cwd(), 'migrations/045_biometric_gateway_and_credentials.sql'), 'utf8');

  // Assert no hardcoded email checks exist
  assert(!eventsRouteSrc.includes('junaid@keyabroad.com'), 'events/route.ts contains 0 hardcoded administrator emails');
  assert(!devicesRouteSrc.includes('junaid@keyabroad.com'), 'devices/route.ts contains 0 hardcoded administrator emails');
  assert(!migration045Src.includes('junaid@keyabroad.com'), '045 migration SQL contains 0 hardcoded administrator emails');

  // Assert machine auth is strictly required on POST /api/biometrics/events
  assert(eventsRouteSrc.includes('authenticateMachineDevice'), 'Ingestion endpoint requires authenticateMachineDevice');
  assert(!eventsRouteSrc.includes('createServerClient()') || eventsRouteSrc.indexOf('createServerClient()') > eventsRouteSrc.indexOf('export async function GET'), 'Machine ingestion POST does not accept human admin sessions');

  // Assert 10:00-11:00 AM check-in window is NOT applied to biometric engine
  const eventEngineSrc = fs.readFileSync(path.resolve(process.cwd(), 'apps/admin/src/lib/biometrics/event-engine.ts'), 'utf8');
  assert(!eventEngineSrc.includes('10:00') && !eventEngineSrc.includes('11:00'), 'Biometric AttendanceEventEngine is not restricted by manual 10-11 AM window');

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  console.log('\n======================================================');
  console.log(`PHASE 4 TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch(err => {
  console.error('Test execution exception:', err);
  process.exit(1);
});
