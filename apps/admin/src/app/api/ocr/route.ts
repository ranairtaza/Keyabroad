import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// We need a server-side Supabase client to fetch the integration key securely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    // 1. Fetch OpenAI key from integrations table
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('api_key, is_active')
      .eq('provider', 'openai')
      .single();

    if (error || !integration?.is_active || !integration.api_key) {
      console.warn("OpenAI integration missing or disabled. Using mock OCR.");
      // Fallback for demo/dev if key isn't configured yet
      await new Promise(r => setTimeout(r, 1500)); // simulate latency
      return NextResponse.json({ 
        text: "MOCK DATA: Passport Name: Ali Raza, Nationality: Pakistani, DOB: 01-01-1995. (Configure OpenAI API Key in Integrations to enable real OCR)." 
      });
    }

    const openai = new OpenAI({ apiKey: integration.api_key });

    // 2. Call OpenAI Vision to read the document
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all the text and relevant data fields from this document. Format as clean text." },
            {
              type: "image_url",
              image_url: {
                url: url,
              },
            },
          ],
        },
      ],
    });

    const extractedText = response.choices[0]?.message?.content || "No text extracted.";

    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
