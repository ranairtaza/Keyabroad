import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const feedbackSchema = z.object({
  student_id: z.string().uuid().optional().nullable(),
  rating: z.number().min(1).max(5),
  review_text: z.string().min(10, "Review must be at least 10 characters").max(2000),
});

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(3, 60 * 1000); // Strict limit for feedback
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const ip = rateLimitResult.ip;

    const body = await request.json();
    const result = feedbackSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    
    const payload = result.data;

    if (!supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error } = await supabaseAdmin.from('student_feedbacks').insert([payload]);

    if (error) {
      console.error(`Error inserting feedback for IP ${ip}:`, error.message);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unexpected error in feedback route:", error.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
