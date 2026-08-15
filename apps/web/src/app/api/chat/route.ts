import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { logSystemError, updateAITelemetry } from '../../../../../../packages/database/src/telemetry';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  const startTime = performance.now();
  
  try {
    const { message, history, sessionId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

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

    const latencyMs = Math.round(performance.now() - startTime);
    const tokensUsed = response.usage?.total_tokens || 0;

    // Optional telemetry logging if a sessionId is supplied, avoiding blocking response
    if (sessionId) {
      const messageId = uuidv4();
      
      const logTelemetry = async () => {
        try {
          // Log user message (Redacted for privacy)
          await supabase.from('ai_messages').insert({
            id: messageId,
            session_id: sessionId,
            role: 'user',
            content: '[REDACTED FOR PRIVACY]',
          });

          // Log assistant response (Redacted for privacy)
          const assistantMessageId = uuidv4();
          await supabase.from('ai_messages').insert({
            id: assistantMessageId,
            session_id: sessionId,
            role: 'assistant',
            content: '[REDACTED FOR PRIVACY]',
            model_version: "gpt-4o-mini",
            tokens_used: tokensUsed,
            latency_ms: latencyMs,
            status: 'success'
          });
        } catch (e) {
          console.error("Failed to log AI message to database", e);
        }
      };
      
      // non-blocking
      logTelemetry();
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    console.error('Chat API Error:', error);
    
    // non-blocking
    logSystemError({
      errorSource: 'api',
      errorMessage: error.message || 'Unknown error in Chat API',
      errorStack: error.stack,
      context: { latencyMs, route: '/api/chat' }
    });

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
