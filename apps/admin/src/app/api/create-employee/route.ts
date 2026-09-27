import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { requireAnyRole, normalizeRole } from '@/lib/auth/authorization';

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
 * POST /api/create-employee
 * Protected Employee Account Creation Endpoint
 * Requires authenticated Owner / Super Admin.
 * Uses cryptographically secure random password generation without exposing it to the browser.
 * Note: Recommended future onboarding method is Supabase Invite / Magic Link.
 */
export async function POST(request: Request) {
  try {
    const actor = await requireAnyRole(['owner', 'admin', 'hr']);
    const supabaseAdmin = getAdminClient();

    const body = await request.json();
    const { name, email, role, location, salary, joined } = body;

    const targetCanonicalRole = normalizeRole(role);
    if (['owner', 'admin'].includes(targetCanonicalRole) && actor.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Only an owner can create an administrator account.' }, { status: 403 });
    }

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required fields.' }, { status: 400 });
    }

    // Generate cryptographically secure random password for account creation
    // Never logged, never returned to browser, never stored in plaintext
    const secureRandomPassword = crypto.randomBytes(24).toString('base64url') + '!Aa9';

    let userId = null;
    let isNewUser = true;

    // Create user in Supabase Auth
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: secureRandomPassword,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (createAuthError) {
      if (createAuthError.message.toLowerCase().includes('already') || createAuthError.status === 422 || createAuthError.status === 400) {
        isNewUser = false;
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (existingProfile) {
          userId = existingProfile.id;
        }
      } else {
        return NextResponse.json({ error: createAuthError.message }, { status: 400 });
      }
    } else {
      userId = authData?.user?.id;
    }

    // Insert or update in team_members
    const newEmp = {
      name,
      email,
      role,
      location: location || 'Main Office',
      joined: joined || new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
      salary: salary || 'TBD',
      status: 'active',
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`
    };

    const { data: existingTeamMember } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('email', email)
      .single();

    if (existingTeamMember) {
      const { error: dbUpdateError } = await supabaseAdmin
        .from('team_members')
        .update(newEmp)
        .eq('id', existingTeamMember.id);

      if (dbUpdateError) {
        return NextResponse.json({ error: `User found but failed to update directory: ${dbUpdateError.message}` }, { status: 500 });
      }
    } else {
      const { error: dbInsertError } = await supabaseAdmin
        .from('team_members')
        .insert([newEmp]);

      if (dbInsertError) {
        return NextResponse.json({ error: `User created but failed to add to directory: ${dbInsertError.message}` }, { status: 500 });
      }
    }

    // Upsert into profiles table
    if (userId) {
      const canonicalRole = normalizeRole(role);
      const isPrivileged = canonicalRole === 'admin' || canonicalRole === 'owner';

      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: email,
        full_name: name,
        role: isPrivileged ? 'admin' : 'staff',
        staff_role: canonicalRole, // Store exact canonical role
        designation: role,
        avatar_url: newEmp.image
      }, { onConflict: 'id' });
    }

    // Return sanitized response WITHOUT any passwords
    return NextResponse.json({
      success: true,
      message: isNewUser
        ? 'Employee account created successfully. Onboarding credentials should be sent via Supabase Magic Link / password reset.'
        : 'Existing user record successfully synchronized in the team directory.'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
