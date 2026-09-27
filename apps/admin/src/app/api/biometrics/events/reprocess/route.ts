import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/auth/server';
import { AttendanceEventEngine } from '@/lib/biometrics/event-engine';
import { NormalizedBiometricEvent } from '@/lib/biometrics/types';
import { BiometricIdentityResolver } from '@/lib/biometrics/identity-resolver';

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
    const { resolveCurrentEmployee } = await import('@/lib/auth/authorization');
    const employee = await resolveCurrentEmployee();
    const isOwnerOrAdmin = employee && ['owner', 'admin'].includes(employee.role);

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
      // 1. Resolve identity
      const resolution = await BiometricIdentityResolver.resolve(rawEv.device_id, rawEv.biometric_user_id, supabaseAdmin);
      
      if (resolution.status === 'MATCHED') {
        const employeeId = resolution.employeeId!;
        const employeeName = resolution.employeeName!;
        const dateStr = rawEv.event_timestamp.substring(0, 10);
        
        try {
          if (rawEv.event_type === 'CHECK_IN') {
             const { data: existingAttendance } = await supabaseAdmin
              .from('employee_attendance')
              .select('id, status, created_at')
              .eq('employee_id', employeeId)
              .eq('date', dateStr)
              .single();

            if (!existingAttendance) {
              await supabaseAdmin.from('employee_attendance').insert({
                employee_id: employeeId,
                employee_name: employeeName,
                status: 'present',
                date: dateStr,
                created_at: rawEv.event_timestamp
              });
            } else if (existingAttendance.status === 'absent' || new Date(rawEv.event_timestamp) < new Date(existingAttendance.created_at)) {
              await supabaseAdmin.from('employee_attendance').update({
                status: 'present',
                created_at: rawEv.event_timestamp
              }).eq('id', existingAttendance.id);
            }
          } else if (rawEv.event_type === 'CHECK_OUT') {
             const { data: existingAttendance } = await supabaseAdmin
              .from('employee_attendance')
              .select('id, status, check_out_time')
              .eq('employee_id', employeeId)
              .eq('date', dateStr)
              .single();

             if (existingAttendance) {
               const currentCheckout = existingAttendance.check_out_time ? new Date(existingAttendance.check_out_time) : null;
               if (!currentCheckout || new Date(rawEv.event_timestamp) > currentCheckout) {
                 await supabaseAdmin.from('employee_attendance').update({
                   check_out_time: rawEv.event_timestamp,
                   status: existingAttendance.status === 'absent' ? 'present' : existingAttendance.status
                 }).eq('id', existingAttendance.id);
               }
             } else {
               await supabaseAdmin.from('employee_attendance').insert({
                 employee_id: employeeId,
                 employee_name: employeeName,
                 status: 'present',
                 date: dateStr,
                 created_at: rawEv.event_timestamp,
                 check_out_time: rawEv.event_timestamp
               });
             }
          }
          
          // Safe state transition of the event
          await supabaseAdmin.from('attendance_events')
            .update({
              employee_id: employeeId,
              processing_status: 'PROCESSED',
              processing_error: null,
              processed_at: new Date().toISOString()
            })
            .eq('id', rawEv.id);
            
          newlyMatchedCount++;
          reprocessedCount++;
        } catch (err: any) {
          await supabaseAdmin.from('attendance_events')
            .update({
              processing_status: 'FAILED',
              processing_error: err.message,
              processed_at: new Date().toISOString()
            })
            .eq('id', rawEv.id);
          reprocessedCount++;
        }
      } else {
         // Still unmatched/inactive
         await supabaseAdmin.from('attendance_events')
            .update({
              processing_status: resolution.status === 'INACTIVE' ? 'IGNORED' : 'UNMATCHED',
              processing_error: resolution.error,
              processed_at: new Date().toISOString()
            })
            .eq('id', rawEv.id);
         reprocessedCount++;
      }
    }

    // Record audit log mandatory
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
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

    if (auditError) {
       throw new Error(`Audit logging failed: ${auditError.message}`);
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
