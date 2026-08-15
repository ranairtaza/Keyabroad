import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logJobRun } from '../../../../../../../packages/database/src/telemetry';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  const startTime = performance.now();
  try {
    const authHeader = req.headers.get('authorization');
    const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key';
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const now = new Date();
    // Use Pakistani time to check 6 PM
    const pakTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
    
    // Only check if it's 6 PM or later
    if (pakTime.getHours() < 18) {
      logJobRun({ jobName: 'check-tasks', status: 'success', durationMs: Math.round(performance.now() - startTime), context: { reason: 'Too early' } });
      return NextResponse.json({ status: 'skipped', reason: 'Too early (before 6 PM)' });
    }

    const todayDateStr = pakTime.toISOString().split('T')[0];

    // Check if we already notified today
    const { data: existingLogs } = await supabase
      .from('notifications')
      .select('id')
      .eq('recipient', 'admin')
      .like('message', `%${todayDateStr}%`)
      .limit(1);

    if (existingLogs && existingLogs.length > 0) {
      logJobRun({ jobName: 'check-tasks', status: 'success', durationMs: Math.round(performance.now() - startTime), context: { reason: 'Already notified today' } });
      return NextResponse.json({ status: 'skipped', reason: 'Already notified today' });
    }

    // Get all pending tasks
    const [regs, enquiries, followups] = await Promise.all([
      supabase.from('registrations').select('assignee').eq('status', 'pending').not('assignee', 'is', null).neq('assignee', ''),
      supabase.from('enquiries').select('assignee').eq('status', 'pending').not('assignee', 'is', null).neq('assignee', ''),
      supabase.from('follow_ups').select('counselor_name').eq('status', 'pending').not('counselor_name', 'is', null).neq('counselor_name', '')
    ]);

    const pendingEmployees = new Set<string>();
    
    if (regs.data) regs.data.forEach(r => pendingEmployees.add(r.assignee));
    if (enquiries.data) enquiries.data.forEach(e => pendingEmployees.add(e.assignee));
    if (followups.data) followups.data.forEach(f => pendingEmployees.add(f.counselor_name));

    if (pendingEmployees.size === 0) {
      logJobRun({ jobName: 'check-tasks', status: 'success', durationMs: Math.round(performance.now() - startTime), context: { reason: 'No pending tasks' } });
      return NextResponse.json({ status: 'skipped', reason: 'No pending tasks' });
    }

    const employeeList = Array.from(pendingEmployees).join(', ');
    const notificationMessage = `[SYSTEM REPORT ${todayDateStr}] The following employees have not completed their pending tasks before 6:00 PM: ${employeeList}`;

    // Send notification to 'admin' and 'owner'
    await supabase.from('notifications').insert([
      { recipient: 'admin', message: notificationMessage },
      { recipient: 'owner', message: notificationMessage }
    ]);

    logJobRun({ jobName: 'check-tasks', status: 'success', durationMs: Math.round(performance.now() - startTime), context: { employees: Array.from(pendingEmployees) } });
    return NextResponse.json({ status: 'success', employees: Array.from(pendingEmployees) });

  } catch (error: any) {
    console.error("Check Tasks Error:", error);
    logJobRun({ jobName: 'check-tasks', status: 'failure', durationMs: Math.round(performance.now() - startTime), error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
