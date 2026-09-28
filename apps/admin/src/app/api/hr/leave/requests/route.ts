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

export async function GET(request: Request) {
  try {
    const employee = await requireAuthenticatedUser();
    const supabaseAdmin = getAdminClient();

    // Role-based fetch: Admins/HR see all, normal employees see own
    const isAdmin = ['owner', 'admin', 'hr', 'operations head'].includes(employee.role);

    let query = supabaseAdmin
      .from('leave_requests')
      .select('*, leave_types(name), team_members(name)');

    if (!isAdmin) {
      query = query.eq('employee_id', employee.teamMemberId);
    }

    const { data: requests, error } = await query;

    if (error) throw error;
    return NextResponse.json({ data: requests });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const employee = await requireAuthenticatedUser();
    const supabaseAdmin = getAdminClient();

    const body = await request.json();
    const { leave_type_id, start_date, end_date, reason } = body;
    
    const start = new Date(start_date);
    const end = new Date(end_date);
    const total_days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    if (total_days <= 0) return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });

    // 1. Check for overlapping requests
    const { data: overlapping, error: overlapError } = await supabaseAdmin
      .from('leave_requests')
      .select('id')
      .eq('employee_id', employee.teamMemberId)
      .in('status', ['PENDING', 'APPROVED'])
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);
    
    if (overlapError) throw overlapError;
    if (overlapping && overlapping.length > 0) {
      return NextResponse.json({ error: 'Leave request overlaps with an existing pending or approved request.' }, { status: 400 });
    }

    // 2. Check balance
    const currentYear = new Date().getFullYear();
    const { data: balance, error: balanceError } = await supabaseAdmin
      .from('leave_balances')
      .select('total_accrued, total_used')
      .eq('employee_id', employee.teamMemberId)
      .eq('leave_type_id', leave_type_id)
      .eq('year', currentYear)
      .single();

    if (balanceError || !balance) {
      return NextResponse.json({ error: 'No leave balance found for this type.' }, { status: 400 });
    }

    if (balance.total_accrued - balance.total_used < total_days) {
      return NextResponse.json({ error: 'Insufficient leave balance.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .insert({
        employee_id: employee.teamMemberId,
        leave_type_id,
        start_date,
        end_date,
        total_days,
        reason,
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return handleApiError(err);
  }
}
