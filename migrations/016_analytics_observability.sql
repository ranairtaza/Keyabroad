-- ============================================================================
-- PHASE 15: ANALYTICS & OBSERVABILITY
-- Migration: 016_analytics_observability.sql
-- ============================================================================

-- 1. AI Telemetry Enhancements
ALTER TABLE ai_messages
ADD COLUMN IF NOT EXISTS tokens_used INTEGER,
ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success';

-- 2. System Errors Table
CREATE TABLE IF NOT EXISTS system_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_source TEXT NOT NULL, -- e.g., 'web', 'admin', 'api', 'job'
    error_message TEXT NOT NULL,
    error_stack TEXT,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;

-- Only Admins can view system errors
DROP POLICY IF EXISTS "Admins view system errors" ON system_errors;
CREATE POLICY "Admins view system errors" ON system_errors
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IN ('super_admin', 'admin'))
    );

-- 3. Job Runs Table
CREATE TABLE IF NOT EXISTS job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'running')),
    duration_ms INTEGER,
    context JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;

-- Only Admins can view job runs
DROP POLICY IF EXISTS "Admins view job runs" ON job_runs;
CREATE POLICY "Admins view job runs" ON job_runs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IN ('super_admin', 'admin'))
    );

-- 4. Storage Metrics RPC
-- Must be SECURITY DEFINER to access storage schema, restricted search_path for safety.
CREATE OR REPLACE FUNCTION get_storage_metrics()
RETURNS TABLE (
    total_size_bytes BIGINT,
    object_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = storage, public
AS $$
BEGIN
    -- Ensure only super_admin or admin can execute this
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND staff_role IN ('super_admin', 'admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT 
        COALESCE(SUM(metadata->>'size')::BIGINT, 0) as total_size_bytes,
        COUNT(*)::BIGINT as object_count
    FROM storage.objects;
END;
$$;
