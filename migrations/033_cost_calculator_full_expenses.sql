-- 1. Add additional expense fields to Countries
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS bank_statement_amount NUMERIC DEFAULT 0;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS embassy_fee NUMERIC DEFAULT 0;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS consultant_fee NUMERIC DEFAULT 0;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS miscellaneous_cost NUMERIC DEFAULT 0;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS scholarship_max_amount NUMERIC DEFAULT 0;
