-- Update invoices table to support receipt fields
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS course text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_amount numeric;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS remaining_amount numeric;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS course_ending text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS deadline text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS received_by text;
