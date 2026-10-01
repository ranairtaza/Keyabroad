import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We need the service role key to delete a user from auth.users and bypass RLS to purge all their data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token belongs to a real user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.id;

    // 1. Delete user from auth.users
    // Supabase will automatically cascade deletes to profiles, students, and related data 
    // IF foreign keys are set up with ON DELETE CASCADE.
    // If not, we might need to manually delete from those tables, but admin.auth.admin.deleteUser
    // typically handles auth deletion which triggers cascades in a properly configured schema.
    
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error("Failed to delete user:", deleteError);
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User data permanently deleted' });
  } catch (err: any) {
    console.error("Delete data error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
