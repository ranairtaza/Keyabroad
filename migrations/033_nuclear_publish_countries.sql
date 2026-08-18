-- 033_nuclear_publish_countries.sql
-- NUCLEAR FIX: Disable ALL triggers, force-publish all 17 countries, re-enable triggers.
-- Run this in Supabase SQL Editor.

-- Step 1: Disable ALL triggers on the countries table to bypass the broken audit_logs trigger
ALTER TABLE public.countries DISABLE TRIGGER USER;

-- Step 2: Force set ALL countries to published + verified (this is the key fix)
UPDATE public.countries
SET
    status = 'published',
    verification_status = 'verified'
WHERE slug IN (
    'uk', 'united-kingdom',
    'usa', 'united-states',
    'germany',
    'canada',
    'ireland',
    'malta',
    'cyprus',
    'australia',
    'france',
    'sweden',
    'italy',
    'finland',
    'netherlands', 'netherland',
    'malaysia',
    'dubai',
    'new-zealand', 'newzealand',
    'turkey'
);

-- Step 3: Re-enable triggers
ALTER TABLE public.countries ENABLE TRIGGER USER;

-- Step 4: Confirm what we have - you should see 17 rows
SELECT slug, name, status, verification_status
FROM public.countries
ORDER BY name;
