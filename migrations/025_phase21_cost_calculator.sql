-- 1. Add Financial Cost Columns to Countries
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD';
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS exchange_rate_to_pkr NUMERIC DEFAULT 278.0;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS average_living_cost_per_year NUMERIC DEFAULT 15000;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS visa_fee NUMERIC DEFAULT 500;

-- 2. Add Required Documents and Average Tuitions to Universities
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '["Passport", "Transcripts", "English Proficiency", "Statement of Purpose"]'::jsonb;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS avg_bachelors_tuition NUMERIC DEFAULT 15000;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS avg_masters_tuition NUMERIC DEFAULT 20000;

-- Note: We will use these new average fields in the Cost Calculator for simplicity, 
-- instead of forcing the user to select specific programs.
