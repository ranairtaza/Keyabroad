import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const appointmentSchema = z.object({
  student_name: z.string().min(1, "Name is required").max(150),
  phone: z.string().min(1, "Phone is required").max(50),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
});

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(5, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const ip = rateLimitResult.ip;

    const body = await request.json();
    const result = appointmentSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    
    const { student_name, phone, appointment_date, appointment_time } = result.data;

    if (!supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error: insertError } = await supabaseAdmin.from('appointments').insert([{
      student_name,
      phone,
      appointment_date,
      appointment_time,
      status: 'scheduled'
    }]);

    if (insertError) {
      console.error(`Appointment insertion failed for IP ${ip}:`, insertError.message);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
    
    // Notify admins safely, don't fail the request if it fails
    supabaseAdmin.from('notifications').insert([{
      recipient: 'Admin',
      message: `New appointment booked by ${student_name} for ${appointment_date}`
    }]).then(({ error }) => {
      if (error) console.error("Failed to insert notification:", error.message);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unexpected error in appointments route:", error.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
