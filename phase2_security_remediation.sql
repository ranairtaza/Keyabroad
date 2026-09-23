-- =================================================================================
-- PHASE 2: SECURITY & IDENTITY REMEDIATION MIGRATION
-- =================================================================================

-- 1. EMPLOYEE ATTENDANCE DATA INTEGRITY CHECK & FOREIGN KEY MIGRATION
-- Before converting employee_id from TEXT to INTEGER, verify complete data integrity.
-- If any invalid, empty, non-numeric, or orphan record is found, ABORT immediately.

DO $$
DECLARE
    invalid_count INTEGER;
    orphan_count INTEGER;
    null_count INTEGER;
BEGIN
    -- Check for NULL or empty string employee_id
    SELECT COUNT(*) INTO null_count
    FROM employee_attendance
    WHERE employee_id IS NULL OR TRIM(employee_id::text) = '';

    IF null_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION ABORTED: Found % records with NULL or empty employee_id in employee_attendance.', null_count;
    END IF;

    -- Check for non-numeric employee_id values
    SELECT COUNT(*) INTO invalid_count
    FROM employee_attendance
    WHERE (employee_id::text !~ '^[0-9]+$');

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION ABORTED: Found % records with non-numeric employee_id in employee_attendance.', invalid_count;
    END IF;

    -- Check for orphan records (employee_id does not exist in team_members.id)
    SELECT COUNT(*) INTO orphan_count
    FROM employee_attendance ea
    WHERE NOT EXISTS (
        SELECT 1 FROM team_members tm WHERE tm.id = ea.employee_id::integer
    );

    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION ABORTED: Found % orphan records in employee_attendance not matching team_members(id).', orphan_count;
    END IF;

    RAISE NOTICE 'Integrity checks PASSED: All employee_attendance records map cleanly to team_members.';
END $$;

-- Convert employee_id to INTEGER and apply ON DELETE RESTRICT to protect historical data
ALTER TABLE employee_attendance
  ALTER COLUMN employee_id TYPE INTEGER USING employee_id::integer;

ALTER TABLE employee_attendance
  DROP CONSTRAINT IF EXISTS fk_employee_attendance_team_member;

ALTER TABLE employee_attendance
  ADD CONSTRAINT fk_employee_attendance_team_member
  FOREIGN KEY (employee_id) REFERENCES team_members(id) ON DELETE RESTRICT;

-- Add performance indexes for attendance querying
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON employee_attendance(date);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_emp_id ON employee_attendance(employee_id);


-- 2. SECURE THE PROFILES TABLE
-- Re-enable RLS on profiles and apply strict non-recursive policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable select for all" ON profiles;
DROP POLICY IF EXISTS "Enable select for authenticated" ON profiles;
DROP POLICY IF EXISTS "Enable update for owner or admin" ON profiles;
DROP POLICY IF EXISTS "Enable insert for service role only" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Users can read their own profile, or staff/admins can read directory profiles
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id OR 
  (auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%'))
);

-- Users can update only their own profile record (whitelisted fields managed via app / APIs)
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- 3. SECURE THE TEAM_MEMBERS TABLE
-- Prevent public exposure of employee records, salaries, and sensitive HR information
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for public" ON team_members;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON team_members;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON team_members;
DROP POLICY IF EXISTS "Enable modify for admins" ON team_members;
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_modify_policy" ON team_members;

-- Strict Read Policy: Normal employees can only read their own record. Admins/Owners can read all team members.
CREATE POLICY "team_members_select_policy" ON team_members FOR SELECT TO authenticated
USING (
  (email = auth.jwt()->>'email') OR 
  (auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%'))
);

-- Strict Modify Policy: Only authorized Admin/Owner users can insert, update, or delete team members
CREATE POLICY "team_members_modify_policy" ON team_members FOR ALL TO authenticated
USING (
  auth.jwt()->>'email' IN (SELECT email FROM team_members AS tm WHERE tm.role ILIKE '%admin%' OR tm.role ILIKE '%ceo%' OR tm.role ILIKE '%founder%')
)
WITH CHECK (
  auth.jwt()->>'email' IN (SELECT email FROM team_members AS tm WHERE tm.role ILIKE '%admin%' OR tm.role ILIKE '%ceo%' OR tm.role ILIKE '%founder%')
);


-- 4. SECURE THE EMPLOYEE_ATTENDANCE TABLE
-- Direct client-side INSERT/UPDATE/DELETE is strictly forbidden.
-- All writes must proceed through protected server-side APIs using trusted database execution.
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for public" ON employee_attendance;
DROP POLICY IF EXISTS "Enable update for public" ON employee_attendance;
DROP POLICY IF EXISTS "Enable select for public" ON employee_attendance;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON employee_attendance;
DROP POLICY IF EXISTS "Enable select for authenticated" ON employee_attendance;
DROP POLICY IF EXISTS "Enable modify for self or admin" ON employee_attendance;
DROP POLICY IF EXISTS "employee_attendance_select_policy" ON employee_attendance;

-- Read: Employees can view their own attendance records; Admins/Owners can view all records
CREATE POLICY "employee_attendance_select_policy" ON employee_attendance FOR SELECT TO authenticated
USING (
  (employee_id = (SELECT id FROM team_members WHERE email = auth.jwt()->>'email'))
  OR
  (auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%'))
);

-- NOTE: No client-side INSERT/UPDATE/DELETE policies are granted on employee_attendance.
-- Attendance writes are exclusively executed server-side via trusted Service Role operations.

-- =================================================================================
-- END OF PHASE 2 MIGRATION
-- =================================================================================
