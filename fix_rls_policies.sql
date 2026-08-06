-- 1. Drop the dangerous public read policy on the enquiries table
DROP POLICY IF EXISTS "Enable select for public" ON enquiries;

-- The public insert and authenticated read policies should already be intact.

-- 2. Clean up any accidental public SELECT policies on older tables if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'registrations') THEN
        DROP POLICY IF EXISTS "Enable select for public" ON registrations;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'walk_ins') THEN
        DROP POLICY IF EXISTS "Enable select for public" ON walk_ins;
    END IF;
END $$;
