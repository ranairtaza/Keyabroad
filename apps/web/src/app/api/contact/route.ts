import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email format").max(255),
  phone: z.string().max(50).optional(),
  message: z.string().min(1, "Message is required").max(5000),
});

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(5, 60 * 1000); // 5 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const ip = rateLimitResult.ip;

    const body = await request.json();
    const result = contactSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    
    const { firstName, lastName, email, phone, message } = result.data;

    if (!supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabaseAdmin.rpc('submit_public_lead', {
      p_first_name: firstName,
      p_last_name: lastName,
      p_email: email,
      p_phone: phone || null,
      p_notes: `CONTACT FORM MESSAGE: ${message}`
    });

    if (error) {
      console.error(`Contact submission failed for IP ${ip}:`, error.message);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unexpected error in contact route:", error.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
