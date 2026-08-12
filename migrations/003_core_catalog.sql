-- 003_core_catalog.sql
-- Creates or Updates the core Master Data schema for KeyAbroad 2.0 (Countries, Universities, Programs, Scholarships)
-- Fully Idempotent & Upgradable Version

-- 0. Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('unverified', 'pending_review', 'verified', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_type') THEN
        CREATE TYPE source_type AS ENUM ('manual', 'legacy_import', 'api');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'publishing_status') THEN
        CREATE TYPE publishing_status AS ENUM ('draft', 'published', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'degree_level') THEN
        CREATE TYPE degree_level AS ENUM ('foundation', 'bachelors', 'masters', 'phd', 'diploma');
    END IF;
END$$;

-- 1. Countries
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE countries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS iso_code TEXT UNIQUE; -- Explicitly ISO, not slug
ALTER TABLE countries ADD COLUMN IF NOT EXISTS flag_code TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS waving_flag_image TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS waving_flag_style TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS status publishing_status DEFAULT 'draft';
ALTER TABLE countries ADD COLUMN IF NOT EXISTS source_type source_type DEFAULT 'manual';
ALTER TABLE countries ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'unverified';
ALTER TABLE countries ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- 2. Country 'Why Choose' bullets (normalized)
CREATE TABLE IF NOT EXISTS country_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE country_features ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id) ON DELETE CASCADE;
ALTER TABLE country_features ADD COLUMN IF NOT EXISTS source_type source_type DEFAULT 'manual';
ALTER TABLE country_features ADD COLUMN IF NOT EXISTS source_reference TEXT;
ALTER TABLE country_features ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'unverified';
ALTER TABLE country_features ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- 3. Universities
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE universities ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id) ON DELETE CASCADE;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS logo_url TEXT;
-- NOTE: commission_structure is explicitly EXCLUDED from the public schema for security.
ALTER TABLE universities ADD COLUMN IF NOT EXISTS status publishing_status DEFAULT 'draft';
ALTER TABLE universities ADD COLUMN IF NOT EXISTS source_type source_type DEFAULT 'manual';
ALTER TABLE universities ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'unverified';
ALTER TABLE universities ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- 4. Programs (Courses)
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE programs ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE CASCADE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS degree_level degree_level;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS tuition_fee NUMERIC;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS status publishing_status DEFAULT 'draft';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS source_type source_type DEFAULT 'manual';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'unverified';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- 5. Scholarships
CREATE TABLE IF NOT EXISTS scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE CASCADE;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id) ON DELETE CASCADE;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS status publishing_status DEFAULT 'draft';
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS source_type source_type DEFAULT 'manual';
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'unverified';
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Add check constraint for scholarships safely
DO $$
BEGIN
  ALTER TABLE scholarships ADD CONSTRAINT chk_scholarship_parent CHECK (university_id IS NOT NULL OR country_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes for fast querying (Removed redundant unique slug indexes which Postgres creates automatically)
CREATE INDEX IF NOT EXISTS idx_countries_status ON countries(status);
CREATE INDEX IF NOT EXISTS idx_universities_country ON universities(country_id);
CREATE INDEX IF NOT EXISTS idx_universities_status ON universities(status);
CREATE INDEX IF NOT EXISTS idx_programs_university ON programs(university_id);
CREATE INDEX IF NOT EXISTS idx_programs_degree ON programs(degree_level);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

-- RLS Policies
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- DROP existing dangerous policies if they exist (e.g. from previous runs using 'USING (true)')
    DROP POLICY IF EXISTS "Public read countries" ON countries;
    DROP POLICY IF EXISTS "Public read country_features" ON country_features;
    DROP POLICY IF EXISTS "Public read universities" ON universities;
    DROP POLICY IF EXISTS "Public read programs" ON programs;
    DROP POLICY IF EXISTS "Public read scholarships" ON scholarships;

    -- PUBLIC POLICIES: Only allow SELECT on 'published' AND 'verified' records
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read published countries' AND tablename = 'countries') THEN
        CREATE POLICY "Public read published countries" ON countries FOR SELECT TO public USING (status = 'published' AND verification_status = 'verified');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read verified country_features' AND tablename = 'country_features') THEN
        CREATE POLICY "Public read verified country_features" ON country_features FOR SELECT TO public USING (
            EXISTS (SELECT 1 FROM countries WHERE countries.id = country_features.country_id AND countries.status = 'published' AND countries.verification_status = 'verified')
            AND verification_status = 'verified'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read published universities' AND tablename = 'universities') THEN
        CREATE POLICY "Public read published universities" ON universities FOR SELECT TO public USING (status = 'published' AND verification_status = 'verified');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read published programs' AND tablename = 'programs') THEN
        CREATE POLICY "Public read published programs" ON programs FOR SELECT TO public USING (status = 'published' AND verification_status = 'verified');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read published scholarships' AND tablename = 'scholarships') THEN
        CREATE POLICY "Public read published scholarships" ON scholarships FOR SELECT TO public USING (status = 'published' AND verification_status = 'verified');
    END IF;

    -- ADMIN POLICIES: Full access for specific staff roles defined in Phase 2
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin full access countries' AND tablename = 'countries') THEN
        CREATE POLICY "Admin full access countries" ON countries FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin', 'branch_manager', 'content_manager'))
        ) WITH CHECK (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin', 'branch_manager', 'content_manager'))
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin full access country_features' AND tablename = 'country_features') THEN
        CREATE POLICY "Admin full access country_features" ON country_features FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin', 'branch_manager', 'content_manager'))
        ) WITH CHECK (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin', 'branch_manager', 'content_manager'))
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin full access universities' AND tablename = 'universities') THEN
        CREATE POLICY "Admin full access universities" ON universities FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin', 'branch_manager', 'content_manager'))
        ) WITH CHECK (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin', 'branch_manager', 'content_manager'))
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin full access programs' AND tablename = 'programs') THEN
        CREATE POLICY "Admin full access programs" ON programs FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin', 'branch_manager', 'content_manager'))
        ) WITH CHECK (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin', 'branch_manager', 'content_manager'))
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin full access scholarships' AND tablename = 'scholarships') THEN
        CREATE POLICY "Admin full access scholarships" ON scholarships FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin', 'branch_manager', 'content_manager'))
        ) WITH CHECK (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin', 'branch_manager', 'content_manager'))
        );
    END IF;
END$$;
