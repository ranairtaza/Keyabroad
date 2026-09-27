import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveCurrentEmployee } from '@/lib/auth/authorization';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { employeeId, worked_from, worked_to } = await req.json();
    if (!employeeId) return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 });

    const authResult = await resolveCurrentEmployee();
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authResult.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('team_members')
      .update({ status: 'resigned', worked_from, worked_to })
      .eq('id', employeeId);

    if (error) throw error;

    return NextResponse.json({ message: 'Employee resigned successfully' });
  } catch (error: any) {
    console.error('Resign Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
