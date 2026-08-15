import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key';
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if it's past 11 AM PKT
    const now = new Date();
    const utcHours = now.getUTCHours();
    const pktHours = (utcHours + 5) % 24;
    
    // Portal is open from 10 to 11. If < 11, do not mark absent yet.
    if (pktHours < 11) {
      return NextResponse.json({ message: 'Portal is still open. Skipping auto-absent.' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get all active employees
    const { data: employees } = await supabaseAdmin
      .from('team_members')
      .select('id, name')
      .eq('status', 'active');

    if (!employees || employees.length === 0) {
      return NextResponse.json({ message: 'No active employees found' });
    }

    // Get today's attendance records (this includes present, leave, and already marked absent)
    const { data: attendance } = await supabaseAdmin
      .from('employee_attendance')
      .select('employee_id')
      .eq('date', today);

    const attendedIds = (attendance || []).map(a => String(a.employee_id));

    const absentRecords = [];
    for (const emp of employees) {
      if (!attendedIds.includes(String(emp.id))) {
        absentRecords.push({
          employee_id: emp.id,
          employee_name: emp.name,
          status: 'absent',
          date: today
        });
      }
    }

    if (absentRecords.length > 0) {
      const { error } = await supabaseAdmin
        .from('employee_attendance')
        .insert(absentRecords);

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Marked ${absentRecords.length} employees as absent.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function GET(request: Request) {
  return POST(request);
}
