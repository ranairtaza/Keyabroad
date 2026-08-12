import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table = 'office_tasks', ...insertData } = body;
    
    // Allowed tables to prevent SQL injection
    const allowedTables = ['office_tasks', 'registrations', 'enquiries', 'follow_ups'];
    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table specified' }, { status: 400 });
    }
    
    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.' },
        { status: 500 }
      );
    }

    // Use service role to bypass RLS for inserts since some tables lack an INSERT policy
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { error: dbError } = await supabaseAdmin
      .from(table)
      .insert([insertData]);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // Securely insert notification bypassing RLS
    if (body.assignee) {
      await supabaseAdmin.from('notifications').insert([{
        recipient: body.assignee,
        message: `You have been assigned a new General Office Task.`
      }]);
    }

    // Log the activity
    const currentUserEmail = request.headers.get('x-user-email') || 'Admin';
    await supabaseAdmin.from('activity_logs').insert([{
      action_type: 'TASK_ASSIGNED',
      description: `Assigned Office Task to ${body.assignee || 'someone'}: ${body.description}`,
      employee_name: currentUserEmail
    }]);
    
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
