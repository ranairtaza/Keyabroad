import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/auth/server';
import { AttendanceEventEngine } from '@/lib/biometrics/event-engine';
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
 * POST /api/biometrics/events/reprocess
 * Reprocesses unmatched or failed biometric events after a mapping has been created or updated.
 */
export async function POST(request: Request) {
  try {
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // Verify Admin / Owner authorization
    const { data: tm } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('email', user.email)
      .single();

    const tmRole = tm?.role?.toLowerCase() || '';
    const isOwnerOrAdmin =
      tmRole.includes('admin') ||
      tmRole.includes('ceo') ||
      tmRole.includes('founder') ||
      user.email === 'junaid@keyabroad.com';

    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 });
    }

    const body = await request.json();
    const { eventId, deviceId, biometricUserId } = body;

    let query = supabaseAdmin
      .from('attendance_events')
      .select('*')
      .in('processing_status', ['UNMATCHED', 'FAILED', 'RECEIVED']);

    if (eventId) {
      query = query.eq('id', eventId);
    } else {
      if (deviceId) query = query.eq('device_id', deviceId);
      if (biometricUserId) query = query.eq('biometric_user_id', biometricUserId);
    }

    const { data: eventsToReprocess, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    if (!eventsToReprocess || eventsToReprocess.length === 0) {
      return NextResponse.json({ message: 'No unmatched or failed events found matching the criteria.', reprocessedCount: 0 });
    }

    let reprocessedCount = 0;
    let newlyMatchedCount = 0;

    for (const rawEv of eventsToReprocess) {
      // Re-run through Event Engine
      const normalized: NormalizedBiometricEvent = {
        deviceId: rawEv.device_id,
        biometricUserId: rawEv.biometric_user_id,
        eventTimestamp: rawEv.event_timestamp,
        eventType: rawEv.event_type,
        verificationMethod: rawEv.verification_method,
        externalEventId: rawEv.external_event_id,
        rawMetadata: rawEv.raw_metadata
      };

      // Delete existing event row so engine can re-evaluate idempotency cleanly
      await supabaseAdmin.from('attendance_events').delete().eq('id', rawEv.id);

      const result = await AttendanceEventEngine.processEvent(normalized, supabaseAdmin);
      reprocessedCount++;

      if (result.status === 'PROCESSED') {
        newlyMatchedCount++;
      }
    }

    // Record audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'BIOMETRIC_EVENTS_REPROCESSED',
        resource_type: 'attendance_events',
        resource_id: eventId || deviceId || 'BATCH',
        details: {
          reprocessed_by: user.email,
          total_reprocessed: reprocessedCount,
          newly_matched: newlyMatchedCount,
          timestamp: new Date().toISOString()
        }
      });
    } catch {
      // Optional
    }

    return NextResponse.json({
      success: true,
      message: `Reprocessed ${reprocessedCount} event(s). ${newlyMatchedCount} event(s) successfully resolved and matched.`,
      reprocessedCount,
      newlyMatchedCount
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
