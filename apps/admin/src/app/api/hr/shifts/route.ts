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

export async function GET(request: Request) {
  try {
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or expired' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: employee, error: empError } = await supabaseAdmin
      .from('team_members')
      .select('id, name, email, role')
      .eq('email', user.email)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ error: 'Forbidden: No active employee profile found.' }, { status: 403 });
    }

    const { data: shifts, error } = await supabaseAdmin
      .from('shifts')
      .select('*')
      .eq('active', true);

    if (error) throw error;
    return NextResponse.json({ data: shifts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or expired' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: employee, error: empError } = await supabaseAdmin
      .from('team_members')
      .select('id, name, email, role')
      .eq('email', user.email)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ error: 'Forbidden: No active employee profile found.' }, { status: 403 });
    }

    const isAdmin = ['OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'].includes(employee.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only HR or Admins can create shifts.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, start_time, end_time, grace_period_minutes, break_duration_minutes, minimum_working_minutes, overtime_threshold_minutes } = body;

    const { data, error } = await supabaseAdmin
      .from('shifts')
      .insert({
        name,
        start_time,
        end_time,
        grace_period_minutes: grace_period_minutes || 0,
        break_duration_minutes: break_duration_minutes || 0,
        minimum_working_minutes: minimum_working_minutes || 0,
        overtime_threshold_minutes: overtime_threshold_minutes || 0
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
