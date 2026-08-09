-- Add a custom_fields JSONB column to support dynamic excel imports
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
