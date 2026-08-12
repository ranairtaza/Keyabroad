-- 004_phase5_discovery.sql
-- Corrected & Idempotent Migration

-- 1. Add Discovery Fields to existing tables safely
DO $$
BEGIN
    -- Universities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='universities' AND column_name='global_ranking') THEN
        ALTER TABLE universities ADD COLUMN global_ranking INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='universities' AND column_name='acceptance_rate') THEN
        ALTER TABLE universities ADD COLUMN acceptance_rate NUMERIC(5,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='universities' AND column_name='intake_months') THEN
        ALTER TABLE universities ADD COLUMN intake_months TEXT[];
    END IF;

    -- Programs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='currency') THEN
        ALTER TABLE programs ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='application_fee') THEN
        ALTER TABLE programs ADD COLUMN application_fee NUMERIC(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='tags') THEN
        ALTER TABLE programs ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- 2. Verify and enforce verification_status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('unverified', 'verified', 'flagged');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='universities' AND column_name='verification_status') THEN
        ALTER TABLE universities ADD COLUMN verification_status verification_status DEFAULT 'unverified';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='verification_status') THEN
        ALTER TABLE programs ADD COLUMN verification_status verification_status DEFAULT 'unverified';
    END IF;
END $$;
