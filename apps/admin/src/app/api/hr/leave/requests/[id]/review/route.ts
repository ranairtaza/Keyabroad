import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthenticatedUser, handleApiError } from '@/lib/auth/authorization';

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
    const employee = await requireAuthenticatedUser();
    const supabaseAdmin = getAdminClient();

    const isAdmin = ['owner', 'admin', 'hr', 'operations head'].includes(employee.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only HR or Admins can review leave requests.' }, { status: 403 });
    }

    const body = await request.json();
    const { status, reviewer_comment } = body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status update.' }, { status: 400 });
    }

    const { data: leaveRequest, error: reqError } = await supabaseAdmin
      .from('leave_requests')
      .select('employee_id')
      .eq('id', id)
      .single();

    if (reqError || !leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found.' }, { status: 404 });
    }

    if (leaveRequest.employee_id === employee.teamMemberId) {
      return NextResponse.json({ error: 'Forbidden: Cannot review your own leave request.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.rpc('review_leave_request', {
      request_id: id,
      new_status: status,
      comment: reviewer_comment,
      reviewer: employee.authUserId
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Fetch updated data to return
    const { data } = await supabaseAdmin.from('leave_requests').select('*').eq('id', id).single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}
