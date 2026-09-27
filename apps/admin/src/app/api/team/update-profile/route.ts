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
    const { updateData, employeeId: providedEmployeeId } = await req.json();
    if (!updateData) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const authResult = await resolveCurrentEmployee();
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetEmployeeId = providedEmployeeId || authResult.teamMemberId;

    // Allow if owner OR if user is updating their own profile
    if (authResult.role !== 'owner' && authResult.teamMemberId !== targetEmployeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove sensitive fields if not owner
    if (authResult.role !== 'owner') {
        delete updateData.email;
        delete updateData.joined;
        delete updateData.salary;
        delete updateData.role;
    }

    const { error } = await supabaseAdmin
      .from('team_members')
      .update(updateData)
      .eq('id', targetEmployeeId);

    if (error) throw error;

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
