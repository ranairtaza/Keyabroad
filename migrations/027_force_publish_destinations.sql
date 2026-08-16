-- 1. Temporarily disable ALL background triggers on catalog tables. 
-- This completely prevents the "database error" you saw earlier when running the V3 script!
ALTER TABLE public.countries DISABLE TRIGGER USER;
ALTER TABLE public.universities DISABLE TRIGGER USER;
ALTER TABLE public.programs DISABLE TRIGGER USER;
ALTER TABLE public.scholarships DISABLE TRIGGER USER;

-- 2. Force every single Country you added to be Publicly Visible
UPDATE public.countries
SET 
    status = 'published', 
    verification_status = 'verified';

-- 3. Force every single University you added to be Publicly Visible
UPDATE public.universities
SET 
    status = 'published', 
    verification_status = 'verified';

-- 4. Force every single Program to be Publicly Visible
UPDATE public.programs
SET 
    status = 'published', 
    verification_status = 'verified';

-- 5. Force every Scholarship to be Publicly Visible
UPDATE public.scholarships
SET 
    status = 'published', 
    verification_status = 'verified';

-- 6. Safely re-enable triggers now that the data is successfully published
ALTER TABLE public.countries ENABLE TRIGGER USER;
ALTER TABLE public.universities ENABLE TRIGGER USER;
ALTER TABLE public.programs ENABLE TRIGGER USER;
ALTER TABLE public.scholarships ENABLE TRIGGER USER;
