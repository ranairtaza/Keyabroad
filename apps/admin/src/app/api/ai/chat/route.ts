import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AIService } from '@keyabroad/ai/src/service';
import { EligibilityEngine } from '@keyabroad/ai/src/engines/matcher';

export async function POST(req: Request) {
  try {
    const { studentId, message } = await req.json();

    if (!studentId || !message) {
      return NextResponse.json({ error: 'Missing studentId or message' }, { status: 400 });
    }

    const cookieStore = await cookies();
    // 1. Initialize Supabase Client securely with the Caller's Auth token
    // This allows Database RLS to enforce all security boundaries automatically.
    const supabase = createServerClient(
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Staff Role Verification
    const { data: profile } = await supabase
      .from('profiles')
      .select('staff_role')
      .eq('id', userId)
      .single();

    if (!profile?.staff_role) {
      return NextResponse.json({ error: 'Forbidden: Requires staff role' }, { status: 403 });
    }

    // 3. Double-Authorization via Database RLS
    // Instead of manually checking junction tables in TypeScript, we attempt to read the student.
    // If the counselor is not assigned to this student, RLS will silently block the read, returning 0 rows.
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Forbidden: Access denied by RLS or student not found' }, { status: 403 });
    }

    // 4. Invoke the hardened @keyabroad/ai package
    const apiKey = process.env.OPENAI_API_KEY || ''; 
    const aiService = new AIService(apiKey);
    const engine = new EligibilityEngine(aiService);

    // The AI Engine evaluates purely for explanation generation. The status is deterministically controlled.
    const result = await engine.evaluate(
      JSON.stringify(student), 
      "General",
      "University requirements context..." // Typically fetched dynamically based on user query
    );

    return NextResponse.json({ 
      reply: `Eligibility Result: ${result.status}\n\nExplanation: ${result.explanation}` 
    });

  } catch (error: any) {
    console.error('Secure Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
