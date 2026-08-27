-- 1. Temporarily disable the broken audit trigger on universities
ALTER TABLE public.universities DISABLE TRIGGER USER;

-- 2. Link all previously added universities correctly
UPDATE public.universities
SET country_id = c.id
FROM public.countries c
WHERE (
  public.universities.country ILIKE c.name OR 
  public.universities.country ILIKE c.slug OR 
  (public.universities.country ILIKE 'UK' AND c.name ILIKE '%United Kingdom%') OR 
  (public.universities.country ILIKE 'USA' AND c.name ILIKE '%United States%') OR 
  (public.universities.country ILIKE 'UAE' AND c.name ILIKE '%United Arab%') OR
  (public.universities.country ILIKE 'Dubai' AND c.name ILIKE '%United Arab%')
)
AND public.universities.country_id IS NULL;

-- 3. Re-enable the user triggers
ALTER TABLE public.universities ENABLE TRIGGER USER;
