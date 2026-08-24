import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We need the service role key to bypass RLS and create auth users securely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, location, salary, joined } = body;

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.' },
        { status: 500 }
      );
    }

    // 1. Authentication & Authorization
    const { createClient: createServerClient } = await import("@/lib/auth/server");
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAuth
      .from('profiles')
      .select('staff_role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['super_admin', 'admin'];
    if (!profile?.staff_role || !allowedRoles.includes(profile.staff_role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create employees' }, { status: 403 });
    }

    // 2. Create a Supabase client with the service role key for the actual creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Create the user in Supabase Auth
    // Set a default temporary password that they should change later
    const tempPassword = 'KeyabroadPassword123!';
    let userId = null;
    let isNewUser = true;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm so they can log in immediately
      user_metadata: { full_name: name }
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already') || authError.status === 422 || authError.status === 400) {
        // User already exists. Find them in profiles.
        isNewUser = false;
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();
          
        if (profile) {
          userId = profile.id;
        }
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    } else {
      userId = authData?.user?.id;
    }

    // 2. Insert or Update into team_members table
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
      const { error: dbUpdateError } = await supabaseAdmin.from('team_members').update(newEmp).eq('id', existingTeamMember.id);
      if (dbUpdateError) {
        return NextResponse.json({ error: `User found but failed to update directory: ${dbUpdateError.message}` }, { status: 500 });
      }
    } else {
      const { error: dbInsertError } = await supabaseAdmin.from('team_members').insert([newEmp]);
      if (dbInsertError) {
        return NextResponse.json({ error: `User created but failed to add to directory: ${dbInsertError.message}` }, { status: 500 });
      }
    }
    
    // 3. Upsert into profiles table to assign their role properly for the dashboard
    if (userId) {
       const isAdminRole = role.toLowerCase().includes('admin') || role.toLowerCase().includes('ceo') || role.toLowerCase().includes('founder');
       
       await supabaseAdmin.from('profiles').upsert({
         id: userId,
         email: email,
         full_name: name,
         role: isAdminRole ? 'admin' : 'staff',
         designation: role,
         avatar_url: newEmp.image
       }, { onConflict: 'id' });
    }

    return NextResponse.json({ 
      success: true, 
      message: isNewUser ? 'Employee account created successfully!' : 'Existing user successfully added to the team directory!',
      tempPassword: isNewUser ? tempPassword : 'User already has a password'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
