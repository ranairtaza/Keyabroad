import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  NormalizedBiometricEvent, 
  IngestionResult, 
  BatchIngestionSummary 
} from './types';
import { BiometricIdentityResolver } from './identity-resolver';

/**
 * AttendanceEventEngine
 * Deterministic, vendor-neutral biometric event processing engine.
 * 
 * Responsibilities:
 * 1. Generates deterministic idempotency hashes for duplicate detection.
 * 2. Resolves employee identity via BiometricIdentityResolver.
 * 3. Applies attendance business logic to `employee_attendance`.
 * 4. Maintains an immutable audit ledger in `attendance_events`.
 */
export class AttendanceEventEngine {
  /**
   * Generates a deterministic idempotency hash.
   * If externalEventId is provided by the device, scope by (device_id + external_event_id).
   * Fallback: scope by (device_id + biometric_user_id + event_type + minute-truncated timestamp).
   */
  public static generateIdempotencyHash(event: NormalizedBiometricEvent): string {
    if (event.externalEventId && event.externalEventId.trim().length > 0) {
      const payload = `EXT:${event.deviceId}:${event.externalEventId.trim()}`;
      return crypto.createHash('sha256').update(payload).digest('hex');
    }

    // Fallback: truncate timestamp to the minute (e.g. 2026-09-20T10:05)
    const dateObj = new Date(event.eventTimestamp);
    const minuteIso = isNaN(dateObj.getTime())
      ? new Date().toISOString().substring(0, 16)
      : dateObj.toISOString().substring(0, 16);

    const payload = `FALLBACK:${event.deviceId}:${event.biometricUserId}:${event.eventType}:${minuteIso}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Ingests and processes a single normalized biometric event.
   */
  public static async processEvent(
    event: NormalizedBiometricEvent,
    supabase: SupabaseClient
  ): Promise<IngestionResult> {
    const idempotencyHash = this.generateIdempotencyHash(event);

    // 1. Duplicate / Idempotency Check
    const { data: existingEvent } = await supabase
      .from('attendance_events')
      .select('id, processing_status, employee_id, processing_error')
      .eq('idempotency_hash', idempotencyHash)
      .single();

    if (existingEvent) {
      return {
        eventId: existingEvent.id,
        status: existingEvent.processing_status,
        idempotencyHash,
        isDuplicate: true,
        resolvedEmployeeId: existingEvent.employee_id,
        actionTaken: 'DUPLICATE_IGNORED'
      };
    }

    // 2. Identity Resolution
    const resolution = await BiometricIdentityResolver.resolve(
      event.deviceId,
      event.biometricUserId,
      supabase
    );

    const nowIso = new Date().toISOString();
    const eventTime = new Date(event.eventTimestamp);
    const validEventTimeIso = isNaN(eventTime.getTime()) ? nowIso : eventTime.toISOString();

    // Determine PKT (UTC+5) Date for attendance recording
    const pktOffsetMs = 5 * 60 * 60 * 1000;
    const pktDate = new Date((isNaN(eventTime.getTime()) ? new Date() : eventTime).getTime() + pktOffsetMs);
    const dateStr = pktDate.toISOString().split('T')[0];

    // 3. Handle UNMATCHED Identity (Mapping does not exist)
    if (resolution.status === 'UNMATCHED') {
      const { data: insertedEvent, error: insertError } = await supabase
        .from('attendance_events')
        .insert({
          device_id: event.deviceId,
          biometric_user_id: event.biometricUserId,
          event_timestamp: validEventTimeIso,
          event_type: event.eventType,
          verification_method: event.verificationMethod,
          external_event_id: event.externalEventId || null,
          idempotency_hash: idempotencyHash,
          received_at: nowIso,
          processed_at: nowIso,
          processing_status: 'UNMATCHED',
          processing_error: resolution.error,
          raw_metadata: event.rawMetadata || {}
        })
        .select('id')
        .single();

      return {
        eventId: insertedEvent?.id || 'error',
        status: 'UNMATCHED',
        idempotencyHash,
        isDuplicate: false,
        error: resolution.error,
        actionTaken: 'UNMATCHED_LOGGED'
      };
    }

    // 4. Handle INACTIVE / INVALID_DEVICE
    if (resolution.status === 'INACTIVE' || resolution.status === 'INVALID_DEVICE') {
      const statusValue = resolution.status === 'INACTIVE' ? 'IGNORED' : 'FAILED';
      const { data: insertedEvent } = await supabase
        .from('attendance_events')
        .insert({
          device_id: event.deviceId,
          employee_id: resolution.employeeId || null,
          biometric_user_id: event.biometricUserId,
          event_timestamp: validEventTimeIso,
          event_type: event.eventType,
          verification_method: event.verificationMethod,
          external_event_id: event.externalEventId || null,
          idempotency_hash: idempotencyHash,
          received_at: nowIso,
          processed_at: nowIso,
          processing_status: statusValue,
          processing_error: resolution.error,
          raw_metadata: event.rawMetadata || {}
        })
        .select('id')
        .single();

      return {
        eventId: insertedEvent?.id || 'error',
        status: statusValue,
        idempotencyHash,
        isDuplicate: false,
        resolvedEmployeeId: resolution.employeeId,
        error: resolution.error,
        actionTaken: resolution.status === 'INACTIVE' ? 'INACTIVE_IGNORED' : 'ERROR_LOGGED'
      };
    }

    // 5. Handle MATCHED Identity -> Deterministic Attendance Writing
    const employeeId = resolution.employeeId!;
    const employeeName = resolution.employeeName!;
    let actionTaken: IngestionResult['actionTaken'] = 'CHECK_IN_RECORDED';

    try {
      if (event.eventType === 'CHECK_IN') {
        const { data: existingAttendance } = await supabase
          .from('employee_attendance')
          .select('id, status, created_at')
          .eq('employee_id', employeeId)
          .eq('date', dateStr)
          .single();

        if (!existingAttendance) {
          // New check-in
          await supabase.from('employee_attendance').insert({
            employee_id: employeeId,
            employee_name: employeeName,
            status: 'present',
            date: dateStr,
            created_at: validEventTimeIso
          });
          actionTaken = 'CHECK_IN_RECORDED';
        } else if (existingAttendance.status === 'absent') {
          // Override auto-absent if employee later punched in
          await supabase.from('employee_attendance').update({
            status: 'present',
            created_at: validEventTimeIso
          }).eq('id', existingAttendance.id);
          actionTaken = 'CHECK_IN_RECORDED';
        } else if (existingAttendance.status === 'present') {
          // If earliest punch is earlier than recorded created_at, update it
          if (new Date(validEventTimeIso) < new Date(existingAttendance.created_at)) {
            await supabase.from('employee_attendance').update({
              created_at: validEventTimeIso
            }).eq('id', existingAttendance.id);
          }
          actionTaken = 'CHECK_IN_RECORDED';
        }
      } else if (event.eventType === 'CHECK_OUT') {
        const { data: existingAttendance } = await supabase
          .from('employee_attendance')
          .select('id, status, check_out_time')
          .eq('employee_id', employeeId)
          .eq('date', dateStr)
          .single();

        if (existingAttendance) {
          // Update check-out timestamp if newer or missing
          const currentCheckout = existingAttendance.check_out_time ? new Date(existingAttendance.check_out_time) : null;
          if (!currentCheckout || new Date(validEventTimeIso) > currentCheckout) {
            await supabase.from('employee_attendance').update({
              check_out_time: validEventTimeIso,
              status: existingAttendance.status === 'absent' ? 'present' : existingAttendance.status
            }).eq('id', existingAttendance.id);
          }
          actionTaken = 'CHECK_OUT_RECORDED';
        } else {
          // Check-out with no prior check-in for the day
          await supabase.from('employee_attendance').insert({
            employee_id: employeeId,
            employee_name: employeeName,
            status: 'present',
            date: dateStr,
            created_at: validEventTimeIso,
            check_out_time: validEventTimeIso
          });
          actionTaken = 'CHECK_OUT_RECORDED';
        }
      }

      // Record event in audit ledger
      const { data: insertedEvent, error: insertError } = await supabase
        .from('attendance_events')
        .insert({
          device_id: event.deviceId,
          employee_id: employeeId,
          biometric_user_id: event.biometricUserId,
          event_timestamp: validEventTimeIso,
          event_type: event.eventType,
          verification_method: event.verificationMethod,
          external_event_id: event.externalEventId || null,
          idempotency_hash: idempotencyHash,
          received_at: nowIso,
          processed_at: nowIso,
          processing_status: 'PROCESSED',
          processing_error: null,
          raw_metadata: event.rawMetadata || {}
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Update device last_sync and last_heartbeat timestamps
      await supabase
        .from('biometric_devices')
        .update({
          last_sync: nowIso,
          last_heartbeat: nowIso,
          updated_at: nowIso,
          consecutive_error_count: 0
        })
        .eq('id', event.deviceId);

      return {
        eventId: insertedEvent?.id || 'ok',
        status: 'PROCESSED',
        idempotencyHash,
        isDuplicate: false,
        resolvedEmployeeId: employeeId,
        resolvedEmployeeName: employeeName,
        actionTaken
      };

    } catch (err: any) {
      // Record failed event for audit and manual remediation
      const { data: failedEvent } = await supabase
        .from('attendance_events')
        .insert({
          device_id: event.deviceId,
          employee_id: employeeId,
          biometric_user_id: event.biometricUserId,
          event_timestamp: validEventTimeIso,
          event_type: event.eventType,
          verification_method: event.verificationMethod,
          external_event_id: event.externalEventId || null,
          idempotency_hash: idempotencyHash,
          received_at: nowIso,
          processed_at: nowIso,
          processing_status: 'FAILED',
          processing_error: err.message || 'Database error while processing attendance',
          raw_metadata: event.rawMetadata || {}
        })
        .select('id')
        .single();

      // Increment device error counts
      const { data: dev } = await supabase
        .from('biometric_devices')
        .select('error_count, consecutive_error_count')
        .eq('id', event.deviceId)
        .single();
        
      if (dev) {
        await supabase
          .from('biometric_devices')
          .update({
            error_count: (dev.error_count || 0) + 1,
            consecutive_error_count: (dev.consecutive_error_count || 0) + 1,
            last_error: err.message || 'Database error while processing attendance',
            updated_at: nowIso
          })
          .eq('id', event.deviceId);
      }

      return {
        eventId: failedEvent?.id || 'error',
        status: 'FAILED',
        idempotencyHash,
        isDuplicate: false,
        resolvedEmployeeId: employeeId,
        error: err.message,
        actionTaken: 'ERROR_LOGGED'
      };
    }
  }

  /**
   * Ingests a batch of normalized biometric events in sequence.
   */
  public static async processBatch(
    events: NormalizedBiometricEvent[],
    supabase: SupabaseClient
  ): Promise<BatchIngestionSummary> {
    const summary: BatchIngestionSummary = {
      totalReceived: events.length,
      processed: 0,
      duplicates: 0,
      unmatched: 0,
      failed: 0,
      ignored: 0,
      results: []
    };

    for (const event of events) {
      const res = await this.processEvent(event, supabase);
      summary.results.push(res);

      if (res.isDuplicate) {
        summary.duplicates++;
      } else if (res.status === 'PROCESSED') {
        summary.processed++;
      } else if (res.status === 'UNMATCHED') {
        summary.unmatched++;
      } else if (res.status === 'FAILED') {
        summary.failed++;
      } else if (res.status === 'IGNORED') {
        summary.ignored++;
      }
    }

    return summary;
  }
}
