import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAnyRole, handleApiError } from '@/lib/auth/authorization';
import { AttendanceEventEngine } from '@/lib/biometrics/event-engine';
import { DeviceCredentialManager } from '@/lib/biometrics/gateway/credentials';
import { GenericBiometricAdapter } from '@/lib/biometrics/gateway/adapter';
import { NormalizedBiometricEvent } from '@/lib/biometrics/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';



function getAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Validates machine request authentication for event ingestion:
 * Strictly requires a verified device machine credential token:
 * - `x-device-api-key` header (ka_dev_<secret>)
 * - `Authorization: Bearer ka_dev_<secret>`
 * 
 * Note: Admin human sessions cannot bypass device credentials on the machine ingestion endpoint.
 */
async function authenticateMachineDevice(
  request: Request,
  claimedDeviceId?: string
): Promise<{ authorized: boolean; deviceId?: string; credentialId?: string; reason?: string; mode?: 'LIVE' | 'TEST'; testExpiresAt?: string | null }> {
  const deviceApiKey = request.headers.get('x-device-api-key');
  const authHeader = request.headers.get('authorization');

  let token = deviceApiKey;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    return {
      authorized: false,
      reason: 'Unauthorized: Machine device API key required in x-device-api-key or Bearer header.'
    };
  }

  const supabaseAdmin = getAdminClient();
  const credAuth = await DeviceCredentialManager.verifyCredential(token, supabaseAdmin, claimedDeviceId);

  if (!credAuth.authenticated || !credAuth.deviceId) {
    return {
      authorized: false,
      reason: credAuth.error || 'Unauthorized: Invalid machine credentials.'
    };
  }

  return {
    authorized: true,
    deviceId: credAuth.deviceId,
    credentialId: credAuth.credentialId,
    mode: credAuth.mode,
    testExpiresAt: credAuth.testExpiresAt
  };
}

/**
 * POST /api/biometrics/events
 * Machine Ingestion Gateway for Biometric Attendance Events.
 * Strictly requires machine device credentials.
 * Enforces size limits, zero-template defense, identity resolution, and deterministic event processing.
 */
export async function POST(request: Request) {
  const supabaseAdmin = getAdminClient();
  let authenticatedDeviceId: string | undefined;

  try {
    // 1. Read raw body and enforce 64KB size limit
    const rawText = await request.text();
    const byteLength = Buffer.byteLength(rawText, 'utf8');

    if (byteLength > 65536) {
      return NextResponse.json(
        { error: `Payload too large. Exceeds 64KB maximum limit (${byteLength} bytes).` },
        { status: 413 }
      );
    }

    let parsedBody: any;
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload.' }, { status: 400 });
    }

    // Inspect first claimed deviceId if present in payload
    const sampleEvent = Array.isArray(parsedBody) ? parsedBody[0] : parsedBody;
    const claimedDeviceId = sampleEvent?.deviceId || sampleEvent?.device_id;

    // 2. Machine Authentication
    const auth = await authenticateMachineDevice(request, claimedDeviceId);
    if (!auth.authorized || !auth.deviceId) {
      if (claimedDeviceId) {
        try {
          await supabaseAdmin.rpc('increment_device_error', {
            p_device_id: claimedDeviceId,
            p_error: auth.reason || 'Authentication failed'
          });
        } catch {
          // Non-blocking telemetry error update
        }
      }
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }

    authenticatedDeviceId = auth.deviceId;

    // 3. Payload Validation with GenericBiometricAdapter (Includes Zero-Template / Zero-Image scanner)
    const validation = GenericBiometricAdapter.validate(parsedBody);
    if (!validation.valid) {
      try {
        await supabaseAdmin
          .from('biometric_devices')
          .update({
            last_error: validation.errors.join('; ')
          })
          .eq('id', authenticatedDeviceId);
      } catch {
        // Non-blocking
      }

      return NextResponse.json(
        { error: 'Payload validation failed.', details: validation.errors },
        { status: 400 }
      );
    }

    // 4. Normalize events, applying the verified deviceId and stripping any client-supplied employee_id
    const normalizedEvents: NormalizedBiometricEvent[] = GenericBiometricAdapter.normalize(
      parsedBody,
      authenticatedDeviceId
    );

    if (normalizedEvents.length === 0) {
      return NextResponse.json({ error: 'No valid events found in payload.' }, { status: 400 });
    }

    let isTest = auth.mode === 'TEST';
    if (isTest && auth.testExpiresAt) {
      if (new Date(auth.testExpiresAt).getTime() < Date.now()) {
        return NextResponse.json({ error: 'TEST mode has expired for this device.' }, { status: 403 });
      }
    }

    // 5. Process through deterministic AttendanceEventEngine
    const summary = await AttendanceEventEngine.processBatch(normalizedEvents, supabaseAdmin, isTest);

    // 6. Update device telemetry in a single batch update upon success
    const nowIso = new Date().toISOString();
    try {
      await supabaseAdmin
        .from('biometric_devices')
        .update({
          last_event_at: nowIso,
          last_sync: nowIso,
          last_authenticated_at: nowIso,
          consecutive_error_count: 0
        })
        .eq('id', authenticatedDeviceId);
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      mode: isTest ? 'TEST' : 'LIVE',
      summary
    });

  } catch (error: any) {
    if (authenticatedDeviceId) {
      try {
        await supabaseAdmin
          .from('biometric_devices')
          .update({
            last_error: error.message || 'Internal processing error'
          })
          .eq('id', authenticatedDeviceId);
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during ingestion.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/biometrics/events
 * Admin Event Viewer (Human Access).
 * Lists attendance events with pagination and filtering for authorized Admins and HR.
 */
export async function GET(request: Request) {
  try {
    const actor = await requireAnyRole(['owner', 'admin', 'hr', 'operations head']);
    const supabaseAdmin = getAdminClient();

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabaseAdmin
      .from('attendance_events')
      .select(`
        id,
        device_id,
        employee_id,
        biometric_user_id,
        event_timestamp,
        event_type,
        verification_method,
        external_event_id,
        received_at,
        processed_at,
        processing_status,
        processing_error,
        raw_metadata,
        biometric_devices (device_name, branch_location),
        team_members (name, email)
      `, { count: 'exact' });

    if (deviceId) query = query.eq('device_id', deviceId);
    if (status) query = query.eq('processing_status', status);
    if (date) {
      const nextDate = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte('event_timestamp', date).lt('event_timestamp', nextDate);
    }

    const { data, error, count } = await query
      .order('event_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (err: any) {
    return handleApiError(err);
  }
}
