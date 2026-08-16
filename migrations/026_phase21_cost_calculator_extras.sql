-- 1. Add extra cost configurations to Countries
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS health_insurance_cost NUMERIC DEFAULT 500;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS flight_ticket_cost NUMERIC DEFAULT 1000;

-- 2. Add extra cost configurations to Universities
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS application_fee NUMERIC DEFAULT 100;
