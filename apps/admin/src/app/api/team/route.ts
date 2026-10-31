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

/**
 * GET /api/team
 * Protected Team Directory Read Endpoint
 * Strictly requires authenticated session.
 * Protects employee salary data for non-owner roles.
 */
export async function GET() {
  try {
    // 1. Authenticate the caller session
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // 2. Fetch team members with admin service client
    let { data: members, error } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Fallback: If team_members has no records, sync from existing staff profiles
    if (!members || members.length === 0) {
      const { data: staffProfiles } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'staff', 'owner'])
        .not('full_name', 'is', null);

      if (staffProfiles && staffProfiles.length > 0) {
        const toInsert = staffProfiles.map(p => ({
          name: p.full_name,
          email: p.email,
          role: p.designation || (p.role === 'admin' ? 'Admin' : 'Counselor'),
          location: 'Head Office',
          status: 'active',
          joined: new Date().toISOString().split('T')[0],
          auth_user_id: p.id
        }));

        const { data: inserted } = await supabaseAdmin
          .from('team_members')
          .insert(toInsert)
          .select();

        if (inserted && inserted.length > 0) {
          members = inserted;
        }
      }
    }

    // 4. Determine if caller is owner to decide salary visibility
    const { data: callerMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
      .limit(1)
      .maybeSingle();

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, staff_role')
      .eq('id', user.id)
      .limit(1)
      .maybeSingle();

    const roleString = (callerMember?.role || callerProfile?.role || callerProfile?.staff_role || '').toLowerCase();
    const isOwner = roleString.includes('owner') || roleString.includes('super_admin') || roleString.includes('super admin');

    // 5. Sanitize sensitive salary data if caller is not an owner
    const sanitizedData = (members || []).map(member => {
      if (!isOwner) {
        return {
          ...member,
          salary: null // Mask salary for non-owners to preserve privacy
        };
      }
      return member;
    });

    return NextResponse.json({ data: sanitizedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
