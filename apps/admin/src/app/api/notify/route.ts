import { NextResponse } from 'next/server';
import { createClient as createServerClient } from "@/lib/auth/server";
import { z } from 'zod';

const NotifySchema = z.object({
  to_email: z.string().email().optional().nullable(),
  to_phone: z.string().optional().nullable(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  type: z.string().optional()
});

const rateLimitCache = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitCache.get(userId);
  if (!record || record.resetTime < now) {
    rateLimitCache.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('staff_role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['super_admin', 'admin', 'branch_manager', 'counselor'];
    if (!profile?.staff_role || !allowedRoles.includes(profile.staff_role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Rate Limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // 4. Input Validation
    const body = await req.json();
    const parseResult = NotifySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input: ' + parseResult.error.message }, { status: 400 });
    }
    
    const { to_email, to_phone, subject, message, type } = parseResult.data;

    // TODO: Add Resend API Key and uncomment to enable real emails
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    
    if (to_email) {
      console.log(`[EMAIL SIMULATION] Sending notification (PII sanitized)`);
      // await resend.emails.send({
      //   from: 'admissions@keyabroad.com',
      //   to: to_email,
      //   subject: subject,
      //   html: `<p>${message}</p>`
      // });
    }

    // TODO: Add Twilio Account SID and Auth Token to enable real WhatsApp
    // import twilio from 'twilio';
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    if (to_phone) {
      console.log(`[WHATSAPP SIMULATION] Sending notification (PII sanitized)`);

      // await client.messages.create({
      //   body: message,
      //   from: 'whatsapp:+14155238886', // Twilio Sandbox Number
      //   to: `whatsapp:${to_phone}`
      // });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification processed (Simulation Mode active until API keys are provided)' 
    });

  } catch (error: any) {
    console.error('Notification Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
