import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/auth/server';
import { computeDeviceHealth } from '@/lib/biometrics/gateway/health';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const AUTHORIZED_ADMIN_ROLES = new Set([
  'admin',
  'super_admin',
  'owner',
  'hr',
  'hr manager',
  'operations head',
  'ceo',
  'founder'
]);

function getAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function verifyAdminAuth() {
  const supabaseAuth = await createServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user || !user.email) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  const supabaseAdmin = getAdminClient();

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, staff_role')
    .eq('id', user.id)
    .single();

  const { data: tm } = await supabaseAdmin
    .from('team_members')
    .select('role')
    .eq('email', user.email)
    .single();

  const pRole = profile?.role?.toLowerCase() || '';
  const sRole = profile?.staff_role?.toLowerCase() || '';
  const tmRole = tm?.role?.toLowerCase() || '';

  const isAuthorized =
    AUTHORIZED_ADMIN_ROLES.has(pRole) ||
    AUTHORIZED_ADMIN_ROLES.has(sRole) ||
    AUTHORIZED_ADMIN_ROLES.has(tmRole);

  if (!isAuthorized) {
    return { authorized: false, error: 'Forbidden: Insufficient privileges.', status: 403 };
  }

  return { authorized: true, user, supabaseAdmin };
}

/**
 * GET /api/biometrics/devices/[id]
 * Retrieves full device details, computed health, telemetry, credentials (sanitized), and recent events.
 * Never returns raw key secret or key_hash.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.authorized || !auth.supabaseAdmin) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: deviceId } = await params;
    const supabaseAdmin = auth.supabaseAdmin;

    // Fetch device record without sensitive internal hash fields
    const { data: device, error: devError } = await supabaseAdmin
      .from('biometric_devices')
      .select('id, device_name, manufacturer, model, serial_number, branch_location, connection_type, adapter_type, status, last_heartbeat, last_event_at, last_authenticated_at, last_sync, error_count, last_error, offline_threshold_minutes, metadata, created_at, updated_at')
      .eq('id', deviceId)
      .single();

    if (devError || !device) {
      return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
    }

    // Fetch credentials without exposing key_hash
    const { data: credentials } = await supabaseAdmin
      .from('device_credentials')
      .select('id, key_name, key_prefix, status, expires_at, revoked_at, revoked_by, last_used_at, created_by, created_at')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });

    // Fetch recent 10 events
    const { data: recentEvents } = await supabaseAdmin
      .from('attendance_events')
      .select('id, biometric_user_id, event_timestamp, event_type, verification_method, processing_status, processing_error')
      .eq('device_id', deviceId)
      .order('event_timestamp', { ascending: false })
      .limit(10);

    return NextResponse.json({
      data: {
        ...device,
        health: computeDeviceHealth(device),
        credentials: credentials || [],
        recentEvents: recentEvents || []
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

/**
 * PATCH /api/biometrics/devices/[id]
 * Updates device settings (name, branch location, status, offline threshold, metadata).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.authorized || !auth.supabaseAdmin || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: deviceId } = await params;
    const supabaseAdmin = auth.supabaseAdmin;
    const user = auth.user;
    const body = await request.json();

    const allowedFields = [
      'device_name',
      'branch_location',
      'status',
      'connection_type',
      'adapter_type',
      'offline_threshold_minutes',
      'metadata'
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data: updatedDevice, error: updateError } = await supabaseAdmin
      .from('biometric_devices')
      .update(updates)
      .eq('id', deviceId)
      .select('id, device_name, manufacturer, model, serial_number, branch_location, connection_type, adapter_type, status, last_heartbeat, last_event_at, last_authenticated_at, last_sync, error_count, last_error, offline_threshold_minutes, metadata, created_at, updated_at')
      .single();

    if (updateError) throw updateError;

    // Audit log with user.id actor
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'BIOMETRIC_DEVICE_UPDATED',
        resource_type: 'biometric_devices',
        resource_id: deviceId,
        details: {
          updates,
          updated_by: user.id,
          timestamp: new Date().toISOString()
        }
      });
    } catch {
      // Optional
    }

    return NextResponse.json({
      success: true,
      message: 'Device updated successfully.',
      data: {
        ...updatedDevice,
        health: computeDeviceHealth(updatedDevice)
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
