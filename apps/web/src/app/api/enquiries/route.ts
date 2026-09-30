import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(10, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const ip = rateLimitResult.ip;

    const payload = await request.json();

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
       return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
    }

    // Force secure values and remove untrusted ones
    delete payload.id;
    delete payload.created_at;
    
    // Generate secure ticket number server-side
    const secureTicketNumber = `T-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    payload.ticket_number = secureTicketNumber;

    if (!supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    let assignee = null;
    let counselorName = null;
    try {
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, name, full_name, email').eq('status', 'active');
      if (profiles && profiles.length > 0) {
        const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
        assignee = randomProfile.id;
        counselorName = randomProfile.name || randomProfile.full_name;
      }
    } catch (e) {
      console.error("Failed to fetch counselors for assignment", e);
    }
    
    payload.assignee = assignee;

    const { error } = await supabaseAdmin.from('enquiries').insert([payload]);

    if (error) {
      console.error(`Error inserting enquiry for IP ${ip}:`, error.message);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket_number: secureTicketNumber, counselor_name: counselorName });
  } catch (error: any) {
    console.error("Unexpected error in enquiry route:", error.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
