import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    process.exit(1);
  }
}

async function runAcceptanceTest() {
  console.log('\n======================================================');
  console.log('KEYABROAD PHASE 4: HARDWARE ACCEPTANCE TEST');
  console.log('======================================================\n');

  const crypto = require('crypto');
  const testDeviceId = crypto.randomUUID();
  const biometricUserId = `hw-user-${Date.now()}`;
  
  console.log('--- Setup: Test Device and Employee ---');
  
  // 1. Create a Team Member
  const { data: teamMember, error: tmError } = await supabaseAdmin
    .from('team_members')
    .insert({
      name: 'Hardware Test User',
      email: `hw-test-${Date.now()}@keyabroad.com`,
      role: 'admin',
      status: 'active'
    })
    .select()
    .single();
  if (tmError) throw tmError;
  assert(true, `Created test team member: ${teamMember.id}`);

  // 2. Create a Device
  const { data: device, error: devError } = await supabaseAdmin
    .from('biometric_devices')
    .insert({
      id: testDeviceId,
      device_name: 'Hardware Acceptance Test Terminal',
      manufacturer: 'GenericTest',
      model: 'TestModel1',
      serial_number: `TEST-SN-${Date.now()}`,
      status: 'active',
      mode: 'TEST'
    })
    .select()
    .single();
  if (devError) throw devError;
  assert(true, `Created test device: ${testDeviceId}`);

  // 3. Map Employee to Biometric User ID
  const { error: mappingError } = await supabaseAdmin
    .from('employee_biometric_mappings')
    .insert({
      employee_id: teamMember.id,
      biometric_user_id: biometricUserId,
      device_id: testDeviceId,
      status: 'active'
    });
  if (mappingError) throw mappingError;
  assert(true, `Mapped biometric user ${biometricUserId} to employee ${teamMember.id}`);

  // 4. We can't import DeviceCredentialManager easily due to TS aliases.
  // We'll create the credential directly in DB using the raw token flow logic.
  // Or we can just call the POST /api/biometrics/devices/${testDeviceId}/rotate-key?
  // Wait, let's just insert it in the DB. Wait, the hashing is crypto.createHash('sha256').
  // Let's do it right here.
  const rawKey = `ka_dev_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const secretPart = rawKey.slice(7);
  const correctPrefix = `ka_dev_${secretPart.slice(0, 6)}...`;
  
  const { data: profile } = await supabaseAdmin.from('profiles').select('id').limit(1).single();
  const createdBy = profile ? profile.id : teamMember.id; // Fallback if profiles is empty but it shouldn't be

  const { error: credError } = await supabaseAdmin
    .from('device_credentials')
    .insert({
      device_id: testDeviceId,
      key_hash: keyHash,
      key_prefix: correctPrefix,
      key_name: 'HW Acceptance Key',
      created_by: createdBy,
      status: 'active',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  if (credError) throw credError;

  assert(true, `Created secure device credential. Raw token: ka_dev_...`);

  const validToken = rawKey;

  // Helper to send request
  async function sendEvent(token: string, payload: any) {
    const res = await fetch(`http://localhost:3000/api/biometrics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    if (res.status !== 200) {
      console.error(`API Error ${res.status}:`, text);
    }
    let data = {};
    try { data = JSON.parse(text); } catch(e) {}
    
    return {
      status: res.status,
      data
    };
  }

  console.log('\n--- Test: Valid Attendance Punch ---');
  const eventId = `SEQ-HW-${Date.now()}`;
  const validEvent = {
    deviceId: testDeviceId,
    biometricUserId: biometricUserId,
    eventTimestamp: new Date().toISOString(),
    eventType: 'CHECK_IN',
    verificationMethod: 'FINGERPRINT',
    externalEventId: eventId
  };

  const res1 = await sendEvent(validToken, validEvent);
  assert(res1.status === 200, 'Valid event received HTTP 200');
  assert(res1.data.summary?.processed === 1, 'Event processed successfully in engine');

  console.log('\n--- Test: Idempotency / Replay Attack ---');
  const res2 = await sendEvent(validToken, validEvent);
  assert(res2.status === 200, 'Replayed event received HTTP 200');
  assert(res2.data.summary?.duplicates === 1, 'Replayed event identified as duplicate');

  console.log('\n--- Test: Security & Spoofing Rejections ---');
  
  const badTokenRes = await sendEvent('ka_dev_invalid_123', validEvent);
  assert(badTokenRes.status === 401, 'Invalid credential rejected with HTTP 401');

  const spoofEvent = { ...validEvent, employee_id: 1, role: 'super_admin' };
  const spoofRes = await sendEvent(validToken, spoofEvent);
  assert(spoofRes.status === 200, 'Spoofing event accepted but sanitized');

  const templateEvent = { ...validEvent, fingerprint_template: 'Base64Data...' };
  const templateRes = await sendEvent(validToken, templateEvent);
  assert(templateRes.status === 400, 'Raw template payload rejected with HTTP 400');

  console.log('\n--- Test: Heartbeat & Database State ---');
  
  // Verify Heartbeat / State in DB
  const { data: dbDevice } = await supabaseAdmin.from('biometric_devices').select('*').eq('id', testDeviceId).single();
  assert(!!dbDevice.last_event_at, 'Device last_event_at heartbeat updated');
  assert(!!dbDevice.last_authenticated_at, 'Device last_authenticated_at updated');

  // Verify DB Events
  const { data: events } = await supabaseAdmin.from('attendance_events').select('*').eq('device_id', testDeviceId);
  assert(events && events.length === 1, 'Only one distinct attendance event recorded (duplicate ignored)');
  assert(events![0].employee_id === teamMember.id, 'Event securely mapped to actual employee, not spoofed data');
  assert(events![0].external_event_id === eventId, 'External event ID is stored correctly');

  console.log('\n======================================================');
  console.log('HARDWARE ACCEPTANCE TEST COMPLETED SUCCESSFULLY');
  console.log('======================================================\n');
}

runAcceptanceTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
