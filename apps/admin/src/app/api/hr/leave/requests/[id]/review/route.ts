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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: 'Forbidden: Only HR or Admins can review leave requests.' }, { status: 403 });
    }

    const body = await request.json();
    const { status, reviewer_comment } = body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status update.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .update({
        status,
        reviewer_comment,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
