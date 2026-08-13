-- 012_phase8_security_patch.sql
-- Fixes critical IDOR vulnerability in legacy students table policies.

-- Note: Executing without an explicit transaction block to prevent deadlocks on live databases.

-- 1. DROP THE LEGACY INSECURE POLICIES
DROP POLICY IF EXISTS "Allow authenticated users to read students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to insert students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to update students" ON students;

-- 2. CREATE SECURE STUDENT ISOLATION POLICIES
CREATE POLICY "students_select_own" ON students 
    FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "students_update_own" ON students 
    FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "students_insert_own" ON students 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- 3. CREATE SECURE STAFF POLICIES
CREATE POLICY "students_all_staff" ON students 
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
    );
