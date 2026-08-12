-- 005_phase6_eligibility.sql
-- Corrected & Idempotent Migration

-- 1. Eligibility Engine Rules (Programs) safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='minimum_cgpa') THEN
        ALTER TABLE programs ADD COLUMN minimum_cgpa NUMERIC(3,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='minimum_percentage') THEN
        ALTER TABLE programs ADD COLUMN minimum_percentage NUMERIC(5,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='minimum_toefl') THEN
        ALTER TABLE programs ADD COLUMN minimum_toefl INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='max_study_gap_years') THEN
        ALTER TABLE programs ADD COLUMN max_study_gap_years INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='work_experience_required') THEN
        ALTER TABLE programs ADD COLUMN work_experience_required BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='min_work_experience_years') THEN
        ALTER TABLE programs ADD COLUMN min_work_experience_years NUMERIC(3,1);
    END IF;
END $$;

-- Normalized Eligibility Engine Architecture
CREATE TABLE IF NOT EXISTS eligibility_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_type TEXT NOT NULL, 
    operator TEXT NOT NULL,
    value_numeric NUMERIC,
    value_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Safely add the unique constraint if it doesn't exist (NULLS NOT DISTINCT requires PG15+)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_eligibility_rules'
    ) THEN
        -- Use standard unique constraint, and handle nulls manually or rely on coalesce if PG15 is not guaranteed
        ALTER TABLE eligibility_rules ADD CONSTRAINT uq_eligibility_rules UNIQUE (rule_type, operator, value_numeric, value_text);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS program_eligibility_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES eligibility_rules(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(program_id, rule_id)
);

-- 2. Cost Calculator Base Rules (Countries)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='countries' AND column_name='avg_living_cost_per_year') THEN
        ALTER TABLE countries ADD COLUMN avg_living_cost_per_year NUMERIC(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='countries' AND column_name='avg_accommodation_cost_per_year') THEN
        ALTER TABLE countries ADD COLUMN avg_accommodation_cost_per_year NUMERIC(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='countries' AND column_name='avg_visa_cost') THEN
        ALTER TABLE countries ADD COLUMN avg_visa_cost NUMERIC(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='countries' AND column_name='avg_insurance_cost') THEN
        ALTER TABLE countries ADD COLUMN avg_insurance_cost NUMERIC(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='countries' AND column_name='avg_flight_cost') THEN
        ALTER TABLE countries ADD COLUMN avg_flight_cost NUMERIC(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='countries' AND column_name='local_currency_code') THEN
        ALTER TABLE countries ADD COLUMN local_currency_code TEXT;
    END IF;
END $$;

-- 3. Lead Generation Table for Eligibility Engine
CREATE TABLE IF NOT EXISTS eligibility_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cgpa NUMERIC(3,2),
    ielts_score NUMERIC(3,1),
    study_gap_years INT,
    budget NUMERIC(10,2),
    preferred_country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
    result_status TEXT, 
    consultation_booked BOOLEAN DEFAULT FALSE,
    raw_assessment_data JSONB
);

-- RLS for leads safely
ALTER TABLE eligibility_leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all leads' AND tablename = 'eligibility_leads') THEN
        CREATE POLICY "Admins can view all leads" ON eligibility_leads
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.staff_role IN ('super_admin', 'admin', 'branch_manager')
                )
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can insert leads' AND tablename = 'eligibility_leads') THEN
        CREATE POLICY "Public can insert leads" ON eligibility_leads
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;
