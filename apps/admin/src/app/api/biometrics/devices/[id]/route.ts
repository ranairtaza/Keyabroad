import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAnyRole, handleApiError } from '@/lib/auth/authorization';
import { computeDeviceHealth } from '@/lib/biometrics/gateway/health';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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
    await requireAnyRole(['owner', 'admin']);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { id: deviceId } = await params;

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

  } catch (err: any) {
    return handleApiError(err);
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
    const actor = await requireAnyRole(['owner', 'admin']);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const userId = actor.authUserId;
    const { id: deviceId } = await params;
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

    // Audit log with userId actor
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'BIOMETRIC_DEVICE_UPDATED',
      resource_type: 'biometric_devices',
      resource_id: deviceId,
      details: {
        updates,
        updated_by: userId,
        timestamp: new Date().toISOString()
      }
    });

    if (auditError) {
      throw new Error(`Audit logging failed: ${auditError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Device updated successfully.',
      data: {
        ...updatedDevice,
        health: computeDeviceHealth(updatedDevice)
      }
    });

  } catch (err: any) {
    return handleApiError(err);
  }
}
