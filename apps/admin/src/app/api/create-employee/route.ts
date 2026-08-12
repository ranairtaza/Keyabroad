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

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Create the user in Supabase Auth
    // Set a default temporary password that they should change later
    const tempPassword = 'KeyabroadPassword123!';
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm so they can log in immediately
      user_metadata: { full_name: name }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insert into team_members table
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

    const { error: dbError } = await supabaseAdmin
      .from('team_members')
      .insert([newEmp]);

    if (dbError) {
      // If adding to team_members fails, we should ideally rollback the user creation, 
      // but for simplicity we'll just return the error.
      return NextResponse.json({ error: `User created but failed to add to directory: ${dbError.message}` }, { status: 500 });
    }
    
    // 3. Upsert into profiles table to assign their role properly for the dashboard
    if (authData?.user?.id) {
       const isAdminRole = role.toLowerCase().includes('admin') || role.toLowerCase().includes('ceo') || role.toLowerCase().includes('founder');
       
       await supabaseAdmin.from('profiles').upsert({
         id: authData.user.id,
         email: email,
         full_name: name,
         role: isAdminRole ? 'admin' : 'staff',
         designation: role,
         avatar_url: newEmp.image
       }, { onConflict: 'id' });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Employee account created successfully!',
      tempPassword 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
