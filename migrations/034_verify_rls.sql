-- Verify what the anonymous user can actually read via RLS
-- Run this in Supabase SQL Editor

-- Check what anon role can see (same as public website)
SET ROLE anon;
SELECT slug, name, status, verification_status FROM public.countries ORDER BY name;
RESET ROLE;
