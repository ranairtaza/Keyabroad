import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@keyabroad/database';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id, content, id } = await req.json();
    if (!conversation_id || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 1. Verify user is a staff member
    const { data: profile } = await supabase
      .from('profiles')
      .select('staff_role, email')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.staff_role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: conversation, error: convError } = await supabase
      .from('student_conversations')
      .select('student_id, students(user_id)')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 2. Insert Message
    const insertPayload: any = {
      conversation_id,
      sender_id: user.id,
      sender_name: profile.email || 'Counselor',
      sender_role: 'counselor',
      content,
    };
    if (id) insertPayload.id = id;

    const { data: message, error: msgError } = await supabase
      .from('student_messages')
      .insert(insertPayload)
      .select()
      .single();

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // 3. Create contextual notification for the student
    // Need student's user_id from students table
    // (We aliased it above in the join: students(user_id))
    const studentUserId = (conversation.students as any)?.user_id;

    if (studentUserId) {
      const supabaseAdmin = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: { get() { return ''; } }
        }
      );

      await supabaseAdmin.from('notifications').insert({
        user_id: studentUserId,
        recipient: 'Student', // Could also be the student's name if we query it
        message: 'New message from your counselor',
      });
    }

    return NextResponse.json({ message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
