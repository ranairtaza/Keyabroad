-- Run this script in the Supabase SQL Editor to enable the AI Chatbot
-- IMPORTANT: Replace 'sk-YOUR_OPENAI_API_KEY_HERE' with your actual OpenAI API Key

INSERT INTO public.integrations (provider, api_key, is_active)
VALUES (
    'openai', 
    'sk-YOUR_OPENAI_API_KEY_HERE', 
    true
)
ON CONFLICT (provider) DO UPDATE 
SET 
    api_key = EXCLUDED.api_key, 
    is_active = EXCLUDED.is_active;
