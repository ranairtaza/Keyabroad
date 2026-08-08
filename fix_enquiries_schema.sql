-- Add missing columns to the enquiries table
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS inquiry_type text;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS city text;

-- Drop the NOT NULL constraint on mobile since the new form might not provide it
ALTER TABLE public.enquiries ALTER COLUMN mobile DROP NOT NULL;
