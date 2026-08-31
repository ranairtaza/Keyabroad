-- Fix payments.received_by foreign key to point to public.profiles instead of auth.users
-- This allows PostgREST to join payments with profiles to get the staff name.

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_received_by_fkey;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_received_by_fkey 
  FOREIGN KEY (received_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;
