import { NextResponse } from 'next/server';
import { EligibilityEngine, AIService } from '@keyabroad/ai';
import { createClient } from '@keyabroad/auth/server';
import { z } from 'zod';

const aiMatcherSchema = z.object({
  studentProfile: z.string().min(5, "Student profile must be at least 5 characters"),
  universityRequirements: z.string().min(5, "University requirements must be at least 5 characters")
});

export async function POST(req: Request) {
  try {
    // 1. Authentication & RBAC
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role === 'student') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    // 2. Validation
    const payload = await req.json();
    const validationResult = aiMatcherSchema.safeParse(payload);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { studentProfile, universityRequirements } = validationResult.data;

    // 3. Business Logic
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const aiService = new AIService(apiKey);
    const engine = new EligibilityEngine(aiService);

    const result = await engine.evaluate(studentProfile, universityRequirements);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Matcher API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
