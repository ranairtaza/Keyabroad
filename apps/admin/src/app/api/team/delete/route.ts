import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAnyRole, handleApiError } from '@/lib/auth/authorization';

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
 * POST /api/team/delete
 * Protected Employee Deletion Endpoint with Historical Integrity Protection
 * Strictly enforces attendance preservation: rejects deletion if attendance records exist.
 */
export async function POST(request: Request) {
  try {
    const actor = await requireAnyRole(['owner', 'admin']);
    const supabaseAdmin = getAdminClient();

    const body = await request.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required.' }, { status: 400 });
    }

    const parsedId = parseInt(String(employeeId), 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid employee ID format.' }, { status: 400 });
    }

    if (parsedId === actor.teamMemberId) {
      return NextResponse.json({ error: 'Forbidden: You cannot delete your own account.' }, { status: 403 });
    }

    // 1. Check if employee exists
    const { data: emp, error: findError } = await supabaseAdmin
      .from('team_members')
      .select('id, name, email')
      .eq('id', parsedId)
      .single();

    if (findError || !emp) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
    }

    // 2. Check for attendance history
    const { count, error: countError } = await supabaseAdmin
      .from('employee_attendance')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', parsedId);

    if (countError) {
      return NextResponse.json({ error: `Failed to verify attendance records: ${countError.message}` }, { status: 500 });
    }

    if (count && count > 0) {
      return NextResponse.json({
        error: `Cannot delete employee '${emp.name}' because ${count} historical attendance record(s) exist. Historical attendance records are legally and operationally protected. Please mark this employee as 'Resigned' or deactivated instead of deleting the profile.`,
        hasAttendanceHistory: true,
        attendanceCount: count,
        recommendation: 'resigned'
      }, { status: 400 });
    }

    // 3. No attendance history exists -> Safe to delete
    const { error: deleteError } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('id', parsedId);

    if (deleteError) {
      return NextResponse.json({ error: `Failed to delete employee: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Employee '${emp.name}' deleted successfully.`
    });

  } catch (err: any) {
    return handleApiError(err);
  }
}
