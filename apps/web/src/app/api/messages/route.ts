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

    // 1. Verify user is the student of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('student_conversations')
      .select('student_id, counselor_id')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Must be the assigned student
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!student || conversation.student_id !== student.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Insert Message
    const insertPayload: any = {
      conversation_id,
      sender_id: user.id,
      sender_name: user.email || 'Student',
      sender_role: 'student',
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

    // 3. Create contextual notification for the counselor
    // We use the service role key to insert the notification securely
    const supabaseAdmin = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: { get() { return ''; } }
      }
    );

    if (conversation.counselor_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: conversation.counselor_id,
        recipient: 'Counselor',
        message: 'New message from your student',
      });
    }

    return NextResponse.json({ message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
