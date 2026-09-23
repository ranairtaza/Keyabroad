import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/auth/server';

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
 * POST /api/attendance/correction
 * Protected Admin/HR Attendance Override & Correction Endpoint
 * Requires authenticated Admin, Owner, or HR manager.
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user from session cookies
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or expired' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // 2. Authorize Admin/Owner/HR role
    const { data: actorProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, staff_role')
      .eq('email', user.email)
      .single();

    const { data: actorTeamMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('email', user.email)
      .single();

    const pRole = actorProfile?.role?.toLowerCase() || '';
    const sRole = actorProfile?.staff_role?.toLowerCase() || '';
    const tmRole = actorTeamMember?.role?.toLowerCase() || '';

    const isAuthorized =
      pRole === 'admin' ||
      sRole === 'admin' ||
      sRole === 'super_admin' ||
      sRole === 'owner' ||
      user.email === 'junaid@keyabroad.com' ||
      tmRole.includes('admin') ||
      tmRole.includes('ceo') ||
      tmRole.includes('founder') ||
      tmRole.includes('hr') ||
      tmRole.includes('operations head');

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges. Only HR/Admins/Owners can perform attendance corrections.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { employeeId, date, status, reason } = body;

    if (!employeeId || !date || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters: employeeId, date, and status are mandatory.' },
        { status: 400 }
      );
    }

    const validStatuses = ['present', 'absent', 'leave', 'missing'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate target employee server-side
    const parsedEmployeeId = parseInt(String(employeeId), 10);
    if (isNaN(parsedEmployeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID format.' }, { status: 400 });
    }

    const { data: targetEmployee, error: empError } = await supabaseAdmin
      .from('team_members')
      .select('id, name, email')
      .eq('id', parsedEmployeeId)
      .single();

    if (empError || !targetEmployee) {
      return NextResponse.json({ error: 'Target employee not found in database.' }, { status: 404 });
    }

    // Check existing attendance log for that date
    const { data: existingLog } = await supabaseAdmin
      .from('employee_attendance')
      .select('*')
      .eq('employee_id', parsedEmployeeId)
      .eq('date', date)
      .single();

    const oldValue = existingLog ? existingLog.status : 'missing';

    // Execute database operation
    if (status === 'missing') {
      if (existingLog) {
        const { error: deleteError } = await supabaseAdmin
          .from('employee_attendance')
          .delete()
          .eq('id', existingLog.id);

        if (deleteError) {
          return NextResponse.json({ error: `Failed to remove record: ${deleteError.message}` }, { status: 500 });
        }
      }
    } else {
      if (existingLog) {
        const { error: updateError } = await supabaseAdmin
          .from('employee_attendance')
          .update({ status: status })
          .eq('id', existingLog.id);

        if (updateError) {
          return NextResponse.json({ error: `Failed to update record: ${updateError.message}` }, { status: 500 });
        }
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('employee_attendance')
          .insert({
            employee_id: parsedEmployeeId,
            employee_name: targetEmployee.name,
            status: status,
            date: date
          });

        if (insertError) {
          return NextResponse.json({ error: `Failed to insert record: ${insertError.message}` }, { status: 500 });
        }
      }
    }

    // Optional: Log audit record if audit_logs table exists
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'ATTENDANCE_CORRECTION',
        resource_type: 'employee_attendance',
        resource_id: String(parsedEmployeeId),
        details: {
          actor_email: user.email,
          target_employee: targetEmployee.name,
          date,
          old_status: oldValue,
          new_status: status,
          reason: reason || 'Manual Admin/HR override',
          timestamp: new Date().toISOString()
        }
      });
    } catch {
      // Ignore if audit_logs table is not yet migrated
    }

    return NextResponse.json({
      success: true,
      message: `Attendance for ${targetEmployee.name} on ${date} updated to ${status}.`,
      correction: {
        actor: user.email,
        targetEmployee: targetEmployee.name,
        date,
        oldStatus: oldValue,
        newStatus: status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
