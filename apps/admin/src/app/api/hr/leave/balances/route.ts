import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthenticatedUser } from '@/lib/auth/authorization';

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
    const employee = await requireAuthenticatedUser();
    const supabaseAdmin = getAdminClient();

    const isAdmin = ['owner', 'admin', 'hr', 'operations head'].includes(employee.role);

    let query = supabaseAdmin
      .from('leave_balances')
      .select('*, leave_types(name), team_members(name)');

    if (!isAdmin) {
      query = query.eq('employee_id', employee.teamMemberId);
    }

    const { data: balances, error } = await query;

    if (error) throw error;
    return NextResponse.json({ data: balances });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
