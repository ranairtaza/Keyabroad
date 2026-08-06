import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Fetch OpenAI key from integrations table (Centralized config via Admin Panel)
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('api_key, is_active')
      .eq('provider', 'openai')
      .single();

    if (error || !integration?.is_active || !integration.api_key) {
      console.warn("OpenAI integration missing or disabled. Using mock response.");
      await new Promise(r => setTimeout(r, 1000));
      return NextResponse.json({ 
        reply: "Sorry, the AI Chatbot is currently offline because the OpenAI API key is not configured in the Admin Dashboard. Please contact support." 
      });
    }

    const openai = new OpenAI({ apiKey: integration.api_key });

    // Ensure history is properly formatted
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are Keyabroad AI, a helpful, professional, and knowledgeable study abroad consultant. Answer queries regarding universities, visas, admissions, and scholarships briefly and accurately. If you don't know something, tell them to book a free consultation with our human experts." 
        },
        ...formattedHistory,
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const reply = response.choices[0]?.message?.content || "I couldn't process that.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
