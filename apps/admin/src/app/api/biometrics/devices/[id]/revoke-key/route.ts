import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAnyRole, handleApiError } from '@/lib/auth/authorization';
import { DeviceCredentialManager } from '@/lib/biometrics/gateway/credentials';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
/**
 * POST /api/biometrics/devices/[id]/revoke-key
 * Revokes a device credential immediately.
 */
export async function POST(
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
    const { credentialId } = body;

    if (!credentialId) {
      return NextResponse.json({ error: 'credentialId is required.' }, { status: 400 });
    }

    // Pass userId as actor
    await DeviceCredentialManager.revokeCredential(
      credentialId,
      userId,
      supabaseAdmin
    );

    // Audit log
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'BIOMETRIC_DEVICE_KEY_REVOKED',
      resource_type: 'device_credentials',
      resource_id: credentialId,
      details: {
        device_id: deviceId,
        revoked_by: userId,
        timestamp: new Date().toISOString()
      }
    });

    if (auditError) {
      throw new Error(`Audit logging failed: ${auditError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Device credential revoked successfully.'
    });

  } catch (err: any) {
    return handleApiError(err);
  }
}
