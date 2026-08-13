import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enquiryFormSchema, rateLimit } from '@keyabroad/validation';
import crypto from 'crypto';

// Use service role key to bypass RLS for external ingest
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function verifySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return signature === digest;
}

export async function POST(req: Request) {
  try {
    // Basic API Rate Limiting (10 requests per 60 seconds per IP)
    // Note: Vercel/Next.js edge limits this to per-region state, but it adds basic protection.
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitResult = await rateLimit(ip, 10, 60);
    
    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too Many Requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((limitResult.reset - Date.now()) / 1000).toString() } }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Validate the incoming payload against the Zod schema
    const validationResult = enquiryFormSchema.safeParse(payload);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validData = validationResult.data;
    
    // Normalization
    const normalizedMobile = validData.mobile.replace(/\s+/g, '').replace(/^00/, '+');
    const normalizedEmail = validData.email ? validData.email.toLowerCase().trim() : null;

    // Idempotency: Use provided key or fallback to a hash of the payload to prevent accidental double-posts
    const idempotencyKey = payload.idempotency_key || crypto.createHash('sha256').update(rawBody).digest('hex');

    // Check Idempotency
    const { data: existing } = await supabase
      .from('enquiries')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Lead already ingested (Idempotent)' });
    }

    // Insert into enquiries table
    const { error } = await supabase.from('enquiries').insert([{
      full_name: validData.full_name,
      dob: validData.dob,
      mobile: normalizedMobile,
      email: normalizedEmail,
      city: validData.city,
      passport_available: validData.passport_available,
      language_test: validData.language_test,
      destinations: validData.destinations,
      preferred_subjects: validData.preferred_subjects,
      status: 'pending', // Fixed status enum constraint
      idempotency_key: idempotencyKey
    }]);

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation (Race condition fallback)
        return NextResponse.json({ success: true, message: 'Lead already ingested (Idempotent)' });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Lead ingested successfully' });

  } catch (error: any) {
    // PII Compliance: Mask any sensitive payload data if the error originated from DB insertions
    const safeError = {
      message: error.message || 'Unknown error',
      code: error.code
    };
    console.error('Lead Webhook Ingestion Error [PII SANITIZED]:', safeError);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
