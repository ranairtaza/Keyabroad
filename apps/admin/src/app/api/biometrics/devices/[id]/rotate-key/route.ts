import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/auth/server';
import { DeviceCredentialManager } from '@/lib/biometrics/gateway/credentials';

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

/**
 * POST /api/biometrics/devices/[id]/rotate-key
 * Rotates device credential with an optional grace period (in hours).
 * Returns new rawApiKey ONLY ONCE.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // Verify Admin / Owner authorization via exact role match
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
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges to rotate device keys.' }, { status: 403 });
    }

    const { id: deviceId } = await params;
    let gracePeriodHours = 24;
    let keyName = 'Rotated Ingestion Key';

    try {
      const body = await request.json();
      if (body.gracePeriodHours !== undefined) {
        gracePeriodHours = Number(body.gracePeriodHours) || 0;
      }
      if (body.keyName) {
        keyName = body.keyName;
      }
    } catch {
      // Body optional
    }

    // Pass user.id as actor
    const rotationResult = await DeviceCredentialManager.rotateCredential(
      deviceId,
      keyName,
      gracePeriodHours,
      user.id,
      supabaseAdmin
    );

    // Audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'BIOMETRIC_DEVICE_KEY_ROTATED',
        resource_type: 'biometric_devices',
        resource_id: deviceId,
        details: {
          key_prefix: rotationResult.keyPrefix,
          grace_period_hours: gracePeriodHours,
          rotated_by: user.id,
          timestamp: new Date().toISOString()
        }
      });
    } catch {
      // Optional
    }

    return NextResponse.json({
      success: true,
      message: 'Device credential rotated successfully.',
      apiKey: rotationResult.rawApiKey, // ONLY revealed once
      keyPrefix: rotationResult.keyPrefix,
      credentialId: rotationResult.credentialId,
      gracePeriodHours
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
