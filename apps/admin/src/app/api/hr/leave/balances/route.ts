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

    const isAdmin = ['OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'].includes(employee.role);

    let query = supabaseAdmin
      .from('leave_balances')
      .select('*, leave_types(name), team_members(name)');

    if (!isAdmin) {
      query = query.eq('employee_id', employee.id);
    }

    const { data: balances, error } = await query;

    if (error) throw error;
    return NextResponse.json({ data: balances });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
