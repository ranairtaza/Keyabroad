import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveCurrentEmployee } from '@/lib/auth/authorization';

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

function getPktTime() {
  const now = new Date();
  const pktOffsetMs = 5 * 60 * 60 * 1000; // PKT = UTC+5
  const pktDate = new Date(now.getTime() + pktOffsetMs);
  const hours = pktDate.getUTCHours();
  const minutes = pktDate.getUTCMinutes();
  const dateStr = pktDate.toISOString().split('T')[0];
  return { now, pktDate, hours, minutes, dateStr };
}

/**
 * POST /api/attendance
 * Protected Self-Attendance Write Endpoint
 * Strictly resolves employee identity from the authenticated server session.
 * Never trusts client-supplied employee IDs.
 */
export async function POST(request: Request) {
  try {
    // 1. Resolve employee record from trusted server identity
    const employee = await resolveCurrentEmployee();
    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized: Session missing, expired, or invalid' }, { status: 401 });
    }

    if (employee.status !== 'active') {
      return NextResponse.json(
        { error: 'Forbidden: Inactive or resigned employees cannot record attendance.' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getAdminClient();

    const body = await request.json();
    const { action, status } = body;
    const { hours, dateStr, now } = getPktTime();

    // 3. Handle Check-Out Action
    if (action === 'check_out') {
      const { data: todayRecord, error: findError } = await supabaseAdmin
        .from('employee_attendance')
        .select('id, status, check_out_time')
        .eq('employee_id', employee.teamMemberId)
        .eq('date', dateStr)
        .single();

      if (findError || !todayRecord) {
        return NextResponse.json({ error: 'No check-in record found for today.' }, { status: 400 });
      }

      if (todayRecord.status !== 'present') {
        return NextResponse.json({ error: `Cannot check out: today's status is ${todayRecord.status}.` }, { status: 400 });
      }

      if (todayRecord.check_out_time) {
        return NextResponse.json({ error: 'You have already checked out today.' }, { status: 400 });
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('employee_attendance')
        .update({ check_out_time: now.toISOString() })
        .eq('id', todayRecord.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: `Failed to record check out: ${updateError.message}` }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Checked out successfully.',
        record: updated
      });
    }

    // 4. Handle Check-In / Mark Attendance (present, leave, absent)
    const targetStatus = status || (action === 'check_in' ? 'present' : null);
    if (!targetStatus || !['present', 'leave', 'absent'].includes(targetStatus)) {
      return NextResponse.json({ error: 'Invalid attendance status requested.' }, { status: 400 });
    }

    // Server-authoritative time check for marking "present"
    if (targetStatus === 'present') {
      if (hours < 10) {
        return NextResponse.json(
          { error: 'Attendance window has not opened yet. It opens strictly at 10:00 AM PKT.' },
          { status: 400 }
        );
      }
      if (hours >= 11) {
        return NextResponse.json(
          { error: 'Attendance window closed at 11:00 AM PKT. Please contact administration for a correction.' },
          { status: 400 }
        );
      }
    }

    // Verify employee has not already marked attendance today
    const { data: existingRecord, error: existingRecordError } = await supabaseAdmin
      .from('employee_attendance')
      .select('id, status')
      .eq('employee_id', employee.teamMemberId)
      .eq('date', dateStr)
      .single();

    if (existingRecordError && existingRecordError.code !== 'PGRST116') {
      return NextResponse.json({ error: `Database error checking existing attendance: ${existingRecordError.message}` }, { status: 500 });
    }

    if (existingRecord) {
      return NextResponse.json(
        { error: `Attendance already recorded for today with status: ${existingRecord.status}.` },
        { status: 400 }
      );
    }

    // Insert trusted attendance record
    const { data: newRecord, error: insertError } = await supabaseAdmin
      .from('employee_attendance')
      .insert({
        employee_id: employee.teamMemberId,
        employee_name: employee.name,
        status: targetStatus,
        date: dateStr,
        created_at: now.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: `Failed to record attendance: ${insertError.message}` }, { status: 500 });
    }

    const message = targetStatus === 'present'
      ? 'Attendance marked successfully.'
      : targetStatus === 'leave'
      ? 'Leave recorded successfully.'
      : 'Absence recorded.';

    return NextResponse.json({
      success: true,
      message,
      record: newRecord
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

/**
 * GET /api/attendance
 * Protected Attendance Read Endpoint
 * Non-admin employees receive only their own records.
 * Admin/Owner users can query all records with optional date/month filters.
 */
export async function GET(request: Request) {
  try {
    const employee = await resolveCurrentEmployee();
    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    const isAdmin = ['admin', 'owner', 'hr', 'operations head'].includes(employee.role);

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabaseAdmin.from('employee_attendance').select('*');

    if (!isAdmin) {
      query = query.eq('employee_id', employee.teamMemberId);
    } else {
      const employeeId = searchParams.get('employeeId');
      if (employeeId) {
        query = query.eq('employee_id', parseInt(employeeId, 10));
      }
    }

    if (date) {
      query = query.eq('date', date);
    } else if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
