import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/auth/server';
import { DeviceCredentialManager } from '@/lib/biometrics/gateway/credentials';
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
 * GET /api/biometrics/devices
 * Lists all registered biometric devices along with computed health status.
 * Never exposes raw secret keys or hashes.
 */
export async function GET() {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.authorized || !auth.supabaseAdmin) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: devices, error } = await auth.supabaseAdmin
      .from('biometric_devices')
      .select('id, device_name, manufacturer, model, serial_number, branch_location, connection_type, adapter_type, status, last_heartbeat, last_event_at, last_authenticated_at, last_sync, error_count, last_error, offline_threshold_minutes, metadata, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach computed health state to each device
    const enrichedDevices = (devices || []).map(dev => ({
      ...dev,
      health: computeDeviceHealth(dev)
    }));

    return NextResponse.json({ data: enrichedDevices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

/**
 * POST /api/biometrics/devices
 * Registers a new biometric device and creates its initial machine credential via DeviceCredentialManager.
 * Plaintext API key token is returned ONLY ONCE in the response and never stored.
 */
export async function POST(request: Request) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.authorized || !auth.supabaseAdmin || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = auth.supabaseAdmin;
    const user = auth.user;

    const body = await request.json();
    const {
      deviceName,
      manufacturer,
      model,
      serialNumber,
      branchLocation,
      connectionType,
      adapterType,
      status,
      offlineThresholdMinutes
    } = body;

    if (!deviceName || !manufacturer || !model || !serialNumber) {
      return NextResponse.json(
        { error: 'deviceName, manufacturer, model, and serialNumber are mandatory fields.' },
        { status: 400 }
      );
    }

    // Check for duplicate serial number
    const { data: existingDevice } = await supabaseAdmin
      .from('biometric_devices')
      .select('id')
      .eq('serial_number', serialNumber.trim())
      .single();

    if (existingDevice) {
      return NextResponse.json(
        { error: `A device with serial number '${serialNumber.trim()}' is already registered.` },
        { status: 400 }
      );
    }

    const { data: newDevice, error: insertError } = await supabaseAdmin
      .from('biometric_devices')
      .insert({
        device_name: deviceName.trim(),
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        serial_number: serialNumber.trim(),
        branch_location: branchLocation || 'Main Office',
        connection_type: connectionType || 'ETHERNET',
        adapter_type: adapterType || 'GENERIC_PULL',
        status: status || 'active',
        offline_threshold_minutes: offlineThresholdMinutes || 15,
        metadata: body.metadata || {}
      })
      .select('id, device_name, manufacturer, model, serial_number, branch_location, connection_type, adapter_type, status, last_heartbeat, last_event_at, last_authenticated_at, last_sync, error_count, last_error, offline_threshold_minutes, metadata, created_at, updated_at')
      .single();

    if (insertError) throw insertError;

    // Generate cryptographic device credential with user.id as created_by
    const credResult = await DeviceCredentialManager.createCredential(
      newDevice.id,
      'Primary Ingestion Key',
      user.id,
      supabaseAdmin
    );

    // Record audit event
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'BIOMETRIC_DEVICE_REGISTERED',
        resource_type: 'biometric_devices',
        resource_id: newDevice.id,
        details: {
          device_name: newDevice.device_name,
          serial_number: newDevice.serial_number,
          registered_by: user.id,
          key_prefix: credResult.keyPrefix,
          timestamp: new Date().toISOString()
        }
      });
    } catch {
      // Optional audit failure tolerance
    }

    return NextResponse.json({
      success: true,
      message: `Device '${newDevice.device_name}' registered successfully.`,
      device: {
        ...newDevice,
        health: computeDeviceHealth(newDevice)
      },
      apiKey: credResult.rawApiKey, // ONLY revealed once to admin upon creation
      keyPrefix: credResult.keyPrefix
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
