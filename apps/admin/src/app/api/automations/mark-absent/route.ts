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

async function runMarkAbsent(targetDate?: string | null) {
  const supabaseAdmin = getAdminClient();

  // Determine which date to process
  const now = new Date();
  const pktOffsetMs = 5 * 60 * 60 * 1000; // PKT = UTC+5
  const pktNow = new Date(now.getTime() + pktOffsetMs);
  const pktHours = pktNow.getUTCHours();

  let date: string;
  if (targetDate) {
    // Retroactive or explicit date
    date = targetDate;
  } else {
    // Same-day automated trigger — only execute after 11:00 AM PKT window closes
    if (pktHours < 11) {
      return NextResponse.json({
        message: 'Attendance portal is still open. Skipping auto-absent.',
        pktHour: pktHours
      });
    }
    date = pktNow.toISOString().split('T')[0];
  }

  // 1. Fetch all active employees
  const { data: employees, error: empError } = await supabaseAdmin
    .from('team_members')
    .select('id, name')
    .eq('status', 'active');

  if (empError) throw empError;
  if (!employees || employees.length === 0) {
    return NextResponse.json({ message: 'No active employees found in directory.', date });
  }

  // 2. Fetch existing attendance records for target date (present, leave, or already absent)
  const { data: attendance, error: attError } = await supabaseAdmin
    .from('employee_attendance')
    .select('employee_id')
    .eq('date', date);

  if (attError) throw attError;

  const attendedIds = new Set((attendance || []).map(a => String(a.employee_id)));

  // 3. Build absent list only for missing records (idempotency)
  const absentRecords: { employee_id: number; employee_name: string; status: string; date: string }[] = [];
  for (const emp of employees) {
    if (!attendedIds.has(String(emp.id))) {
      absentRecords.push({
        employee_id: emp.id,
        employee_name: emp.name,
        status: 'absent',
        date,
      });
    }
  }

  if (absentRecords.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('employee_attendance')
      .insert(absentRecords);

    if (insertError) throw insertError;
  }

  return NextResponse.json({
    success: true,
    date,
    message: `Marked ${absentRecords.length} employee(s) as absent for ${date}.`,
    markedCount: absentRecords.length
  });
}

/**
 * Helper to check authorization via CRON_SECRET or authenticated Admin session
 */
async function authorizeRequest(request: Request): Promise<{ authorized: boolean; reason?: string }> {
  // 1. Check CRON_SECRET authorization header
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true };
  }

  // 2. Check authenticated Admin / Owner / HR session
  try {
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (!authError && user && user.email) {
      const supabaseAdmin = getAdminClient();
      const { resolveCurrentEmployee } = await import('@/lib/auth/authorization');
      const employee = await resolveCurrentEmployee();
      const isAdmin = employee && ['owner', 'admin', 'hr', 'operations head'].includes(employee.role);

      if (isAdmin) {
        return { authorized: true };
      }
    }
  } catch {
    // Session check failed
  }

  return { authorized: false, reason: 'Unauthorized: Valid CRON_SECRET or Admin/HR session required.' };
}

/**
 * POST /api/automations/mark-absent
 * Idempotent Mark-Absent Execution Endpoint
 * Supports trusted automation (CRON_SECRET) or manual Admin execution.
 */
export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }

    let targetDate: string | null = null;
    try {
      const body = await request.json();
      if (body?.date) targetDate = body.date;
    } catch {
      // Body is optional
    }

    return await runMarkAbsent(targetDate);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

/**
 * GET /api/automations/mark-absent?date=YYYY-MM-DD
 * Convenience endpoint for scheduled cron tasks.
 * Strictly requires valid CRON_SECRET or Admin session.
 */
export async function GET(request: Request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    return await runMarkAbsent(date);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
