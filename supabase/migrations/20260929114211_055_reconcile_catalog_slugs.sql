-- 1. Disable broken audit triggers during migration
ALTER TABLE public.universities DISABLE TRIGGER trg_audit_universities;

-- 2. Add slug to universities if not exists
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS slug text;

-- 2. Populate university slugs deterministically where missing
UPDATE public.universities
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE slug IS NULL;

-- 3. Handle any potential collisions in universities
WITH numbered_slugs AS (
  SELECT id,
         slug || CASE WHEN row_number() OVER (PARTITION BY slug ORDER BY created_at) > 1
                      THEN '-' || (row_number() OVER (PARTITION BY slug ORDER BY created_at) - 1)::text
                      ELSE '' END as new_slug
  FROM public.universities
)
UPDATE public.universities u
SET slug = ns.new_slug
FROM numbered_slugs ns
WHERE u.id = ns.id AND u.slug != ns.new_slug;

-- 4. Apply NOT NULL and UNIQUE constraints idempotently for universities
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'universities_slug_key'
  ) THEN
    ALTER TABLE public.universities ADD CONSTRAINT universities_slug_key UNIQUE (slug);
  END IF;
END $$;

ALTER TABLE public.universities ALTER COLUMN slug SET NOT NULL;

-- 5. Enable audit trigger again
ALTER TABLE public.universities ENABLE TRIGGER trg_audit_universities;

-- 6. Disable broken audit triggers for programs
ALTER TABLE public.programs DISABLE TRIGGER trg_audit_programs;

-- 7. Add slug to programs if not exists
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS slug text;

-- 6. Populate program slugs deterministically where missing
UPDATE public.programs
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE slug IS NULL;

-- 7. Handle any potential collisions in programs
WITH numbered_slugs AS (
  SELECT id,
         slug || CASE WHEN row_number() OVER (PARTITION BY slug ORDER BY created_at) > 1
                      THEN '-' || (row_number() OVER (PARTITION BY slug ORDER BY created_at) - 1)::text
                      ELSE '' END as new_slug
  FROM public.programs
)
UPDATE public.programs p
SET slug = ns.new_slug
FROM numbered_slugs ns
WHERE p.id = ns.id AND p.slug != ns.new_slug;

-- 8. Apply NOT NULL and UNIQUE constraints idempotently for programs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'programs_slug_key'
  ) THEN
    ALTER TABLE public.programs ADD CONSTRAINT programs_slug_key UNIQUE (slug);
  END IF;
END $$;

ALTER TABLE public.programs ALTER COLUMN slug SET NOT NULL;

-- 11. Enable audit trigger again
ALTER TABLE public.programs ENABLE TRIGGER trg_audit_programs;
