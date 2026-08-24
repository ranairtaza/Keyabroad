-- 035_migrate_programs_slug.sql
-- Adds the slug column to the programs table, populates missing slugs, and enforces composite uniqueness.

-- 1. Ensure the slug column exists
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Populate slugs for programs that don't have one
-- Converts name to lowercase and replaces non-alphanumeric characters with hyphens
UPDATE public.programs
SET slug = REGEXP_REPLACE(LOWER(TRIM(name)), '[^a-z0-9]+', '-', 'g')
WHERE slug IS NULL OR slug = '';

-- 3. Cleanup: Remove trailing or leading hyphens that might result from the regex
UPDATE public.programs
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug IS NOT NULL;

-- 4. Enforce Composite Uniqueness (university_id + slug)
-- First drop it safely if it exists, then recreate it.
DO $$ 
BEGIN
    ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_university_slug_key;
    ALTER TABLE public.programs ADD CONSTRAINT programs_university_slug_key UNIQUE (university_id, slug);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
