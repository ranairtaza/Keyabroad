import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const registrationSchema = z.object({
  student_name: z.string().min(1, "Name is required").max(150),
  phone: z.string().min(1, "Phone is required").max(50),
  email: z.string().email("Invalid email").max(255),
  test: z.string().min(1, "Test is required").max(100),
  target_score: z.string().optional().nullable(),
  status: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(5, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const ip = rateLimitResult.ip;

    const body = await request.json();
    const result = registrationSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    
    const payload = result.data;
    payload.status = 'pending'; // Enforce pending status

    if (!supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error } = await supabaseAdmin.from('registrations').insert([payload]);

    if (error) {
      console.error(`Error inserting registration for IP ${ip}:`, error.message);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unexpected error in registrations route:", error.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
