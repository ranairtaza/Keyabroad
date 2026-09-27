import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/auth/server';
import { calculateWorkforceStatus } from '@/lib/hr/workforceStatus';

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
    
    // Check Authorization header for tests/API clients
    let token = request.headers.get('authorization')?.split('Bearer ')[1];

    let user;
    let authError;

    if (token) {
      const res = await supabaseAuth.auth.getUser(token);
      user = res.data.user;
      authError = res.error;
    } else {
      const res = await supabaseAuth.auth.getUser();
      user = res.data.user;
      authError = res.error;
    }

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: requester, error: reqError } = await supabaseAdmin
      .from('team_members')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (reqError || !requester) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Default to today PKT
    const now = new Date();
    const pktOffsetMs = 5 * 60 * 60 * 1000;
    const pktDate = new Date(now.getTime() + pktOffsetMs);
    const targetDate = dateParam || pktDate.toISOString().split('T')[0];

    const isAdmin = ['OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'].includes(requester.role);

    const result = await calculateWorkforceStatus(
      supabaseAdmin,
      targetDate,
      isAdmin,
      requester.id
    );

    return NextResponse.json(result);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
