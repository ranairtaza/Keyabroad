import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAnyRole, handleApiError } from '@/lib/auth/authorization';
import { DeviceCredentialManager } from '@/lib/biometrics/gateway/credentials';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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
    const actor = await requireAnyRole(['owner', 'admin']);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const userId = actor.authUserId;

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

    // Pass userId as actor
    const rotationResult = await DeviceCredentialManager.rotateCredential(
      deviceId,
      keyName,
      gracePeriodHours,
      userId,
      supabaseAdmin
    );

    // Audit log
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'BIOMETRIC_DEVICE_KEY_ROTATED',
      resource_type: 'biometric_devices',
      resource_id: deviceId,
      details: {
        key_prefix: rotationResult.keyPrefix,
        grace_period_hours: gracePeriodHours,
        rotated_by: userId,
        timestamp: new Date().toISOString()
      }
    });

    if (auditError) {
      throw new Error(`Audit logging failed: ${auditError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Device credential rotated successfully.',
      apiKey: rotationResult.rawApiKey, // ONLY revealed once
      keyPrefix: rotationResult.keyPrefix,
      credentialId: rotationResult.credentialId,
      gracePeriodHours
    });

  } catch (err: any) {
    return handleApiError(err);
  }
}
