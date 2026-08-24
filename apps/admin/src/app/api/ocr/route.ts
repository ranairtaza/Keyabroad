import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from "@/lib/auth/server";
import { z } from 'zod';

const RequestSchema = z.object({
  url: z.string().url("Must be a valid URL")
});

// Basic in-memory rate limit per instance (useful fallback if Redis is not configured)
const rateLimitCache = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Service role client needed *only* to read the secure integrations table
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorization (RBAC)
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
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input: ' + parseResult.error.message }, { status: 400 });
    }
    const { url } = parseResult.data;

    // 5. Fetch OpenAI key (Using Service Role because 'integrations' is locked down)
    const { data: integration, error } = await supabaseAdmin
      .from('integrations')
      .select('api_key, is_active')
      .eq('provider', 'openai')
      .single();

    if (error || !integration?.is_active || !integration.api_key) {
      console.warn("OpenAI integration missing or disabled. Using mock OCR.");
      await new Promise(r => setTimeout(r, 1500)); 
      return NextResponse.json({ 
        text: "MOCK DATA: Passport Name: Ali Raza, Nationality: Pakistani, DOB: 01-01-1995. (Configure OpenAI API Key in Integrations to enable real OCR)." 
      });
    }

    const openai = new OpenAI({ apiKey: integration.api_key });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all the text and relevant data fields from this document. Format as clean text." },
            { type: "image_url", image_url: { url: url } },
          ],
        },
      ],
    });

    const extractedText = response.choices[0]?.message?.content || "No text extracted.";
    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
