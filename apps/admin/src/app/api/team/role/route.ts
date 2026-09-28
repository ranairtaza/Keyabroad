import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAnyRole, normalizeRole, handleApiError } from '@/lib/auth/authorization';

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

const ALLOWED_ROLES = [
  'CEO/Founder',
  'Admin/CEO',
  'Admin',
  'Accountant',
  'Language Instructor',
  'Lead Educational Counsellor',
  'Visa Processing Specialist',
  'Career Guidance Expert',
  'Student Success Coordinator',
  'Marketing Executive',
  'Social Media & Marketing Executive',
  'Social Media Manager',
  'Admission and Marketing Executive',
  'Branch Manager',
  'Operations Head',
  'Internee'
];

/**
 * POST /api/team/role
 * Protected Server-side Role Assignment Endpoint
 * Strictly requires authenticated Owner / Admin role.
 */
export async function POST(request: Request) {
  try {
    const actor = await requireAnyRole(['owner', 'admin']);
    const supabaseAdmin = getAdminClient();

    const body = await request.json();
    const { employeeId, newRole } = body;

    if (!employeeId || !newRole) {
      return NextResponse.json({ error: 'employeeId and newRole are required.' }, { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(newRole)) {
      return NextResponse.json(
        { error: `Invalid role '${newRole}'. Must be one of: ${ALLOWED_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const parsedId = parseInt(String(employeeId), 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid employee ID format.' }, { status: 400 });
    }

    if (parsedId === actor.teamMemberId) {
      return NextResponse.json({ error: 'Forbidden: Cannot change your own role.' }, { status: 403 });
    }

    const targetCanonicalRole = normalizeRole(newRole);
    if (['owner', 'admin'].includes(targetCanonicalRole) && actor.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Only an owner can assign an administrator role.' }, { status: 403 });
    }

    // Update team_members record
    const { data: updatedEmp, error: tmError } = await supabaseAdmin
      .from('team_members')
      .update({ role: newRole })
      .eq('id', parsedId)
      .select('id, name, email, role')
      .single();

    if (tmError || !updatedEmp) {
      return NextResponse.json({ error: `Failed to update team member: ${tmError?.message}` }, { status: 500 });
    }

    // Synchronize profile role & designation
    if (updatedEmp.email) {
      const canonicalRole = normalizeRole(newRole);
      const isPrivileged = canonicalRole === 'admin' || canonicalRole === 'owner';

      await supabaseAdmin
        .from('profiles')
        .update({
          role: isPrivileged ? 'admin' : 'staff',
          staff_role: canonicalRole, // Store exact canonical role
          designation: newRole
        })
        .eq('email', updatedEmp.email);
    }

    return NextResponse.json({
      success: true,
      message: `Role for ${updatedEmp.name} successfully updated to ${newRole}.`,
      employee: updatedEmp
    });

  } catch (err: any) {
    return handleApiError(err);
  }
}
