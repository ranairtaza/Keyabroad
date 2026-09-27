-- =================================================================================
-- PHASE 6B: WORKFORCE ATTENDANCE INTELLIGENCE
-- =================================================================================

-- 1. COMPANY HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS hr_holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hr_holidays_date ON hr_holidays(date);

-- 2. ROW LEVEL SECURITY POLICIES FOR HOLIDAYS
ALTER TABLE hr_holidays ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view active holidays
DROP POLICY IF EXISTS "hr_holidays_select" ON hr_holidays;
CREATE POLICY "hr_holidays_select" ON hr_holidays FOR SELECT TO authenticated USING (true);

-- Only Admins/HR/Owner can modify holidays
DROP POLICY IF EXISTS "hr_holidays_admin_modify" ON hr_holidays;
CREATE POLICY "hr_holidays_admin_modify" ON hr_holidays FOR ALL TO authenticated
USING (
  auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%' OR role ILIKE '%hr%')
  OR auth.jwt()->>'email' = 'junaid@keyabroad.com'
)
WITH CHECK (
  auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%' OR role ILIKE '%hr%')
  OR auth.jwt()->>'email' = 'junaid@keyabroad.com'
);

-- We don't need to add columns to employee_attendance for calculated metrics yet,
-- as Phase 6B requirements strictly demand deterministic server-side calculation of:
-- worked_minutes, late_minutes, early_departure, overtime.
-- These can be calculated on the fly by combining shifts + check_in/check_out.

-- Add a comment to mark migration success
COMMENT ON TABLE hr_holidays IS 'Phase 6B: Company holidays for deterministic attendance intelligence';
