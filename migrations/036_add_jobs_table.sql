-- 036_add_jobs_table.sql

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    employment_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view published jobs' AND tablename = 'jobs') THEN
        CREATE POLICY "Public can view published jobs" ON jobs
            FOR SELECT USING (status = 'published');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage jobs' AND tablename = 'jobs') THEN
        CREATE POLICY "Admins can manage jobs" ON jobs
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.staff_role IN ('super_admin', 'admin', 'branch_manager')
                )
            );
    END IF;
END $$;
