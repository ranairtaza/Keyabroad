import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function runMarkAbsent(targetDate?: string | null) {
  if (!supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Determine which date to process
  const now = new Date();
  // PKT = UTC+5
  const pktOffsetMs = 5 * 60 * 60 * 1000;
  const pktNow = new Date(now.getTime() + pktOffsetMs);
  const pktHours = pktNow.getUTCHours();

  let date: string;
  if (targetDate) {
    // Retroactive call — skip the time-window guard
    date = targetDate;
  } else {
    // Same-day auto call — only proceed after 11 AM PKT
    if (pktHours < 11) {
      return NextResponse.json({
        message: 'Portal is still open. Skipping auto-absent.',
        pktHour: pktHours
      });
    }
    date = pktNow.toISOString().split('T')[0];
  }

  // Get all active employees
  const { data: employees, error: empError } = await supabaseAdmin
    .from('team_members')
    .select('id, name')
    .eq('status', 'active');

  if (empError) throw empError;
  if (!employees || employees.length === 0) {
    return NextResponse.json({ message: 'No active employees found' });
  }

  // Get attendance records for the target date (present, leave, or already absent)
  const { data: attendance, error: attError } = await supabaseAdmin
    .from('employee_attendance')
    .select('employee_id')
    .eq('date', date);

  if (attError) throw attError;

  const attendedIds = (attendance || []).map(a => String(a.employee_id));

  const absentRecords: { employee_id: any; employee_name: any; status: string; date: string }[] = [];
  for (const emp of employees) {
    if (!attendedIds.includes(String(emp.id))) {
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
    message: `Marked ${absentRecords.length} employee(s) as absent.`,
  });
}

/**
 * POST /api/automations/mark-absent
 * Called internally from the attendance page (no auth required — internal only).
 * Optionally accepts JSON body { date: 'YYYY-MM-DD' } to backfill a past date.
 */
export async function POST(request: Request) {
  try {
    let targetDate: string | null = null;
    try {
      const body = await request.json();
      if (body?.date) targetDate = body.date;
    } catch {
      // No body or non-JSON — that's fine
    }
    return await runMarkAbsent(targetDate);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/automations/mark-absent?date=YYYY-MM-DD
 * Convenience endpoint for cron jobs or manual admin triggers.
 * Requires CRON_SECRET authorization header for GET requests.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key';
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    return await runMarkAbsent(date);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
