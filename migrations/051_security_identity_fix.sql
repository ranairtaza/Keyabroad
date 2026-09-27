-- =================================================================================
-- PHASE 6C: ROW LEVEL SECURITY HARDENING (AUTHORIZATION IDENTITY FIX)
-- =================================================================================

BEGIN;

-- 1. Create a parameterless SECURITY DEFINER function to reliably map canonical roles
-- based strictly on the authenticated session. 
-- NOTE: We use auth.jwt()->>'email' as a compatibility lookup until a direct user_id 
-- FK is established in team_members, but we ensure it cannot be caller-supplied.
CREATE OR REPLACE FUNCTION public.get_current_canonical_role()
RETURNS text AS $$
DECLARE
    raw_role text;
    user_email text;
BEGIN
    user_email := auth.jwt()->>'email';
    
    IF user_email IS NULL THEN
        RETURN 'employee';
    END IF;

    SELECT role INTO raw_role FROM public.team_members WHERE email = user_email;
    IF raw_role IS NULL THEN
        RETURN 'employee';
    END IF;
    
    raw_role := trim(lower(raw_role));
    
    IF raw_role IN ('owner', 'super_admin', 'super admin') THEN
        RETURN 'owner';
    END IF;
    
    IF raw_role = 'admin' THEN
        RETURN 'admin';
    END IF;
    
    IF raw_role IN ('hr', 'hr manager') THEN
        RETURN 'hr';
    END IF;
    
    IF raw_role = 'operations head' THEN
        RETURN 'operations head';
    END IF;
    
    RETURN 'employee';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke default execution and grant explicitly to authenticated users
REVOKE EXECUTE ON FUNCTION public.get_current_canonical_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_canonical_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_canonical_role() TO service_role;

-- 2. Update Migration 044: Biometric Attendance Foundation
DROP POLICY IF EXISTS "biometric_devices_admin_select" ON biometric_devices;
CREATE POLICY "biometric_devices_admin_select" ON biometric_devices FOR SELECT TO authenticated
USING (
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

DROP POLICY IF EXISTS "biometric_devices_admin_modify" ON biometric_devices;
CREATE POLICY "biometric_devices_admin_modify" ON biometric_devices FOR ALL TO authenticated
USING (
  public.get_current_canonical_role() IN ('owner', 'admin')
)
WITH CHECK (
  public.get_current_canonical_role() IN ('owner', 'admin')
);

DROP POLICY IF EXISTS "emp_biometric_mappings_select" ON employee_biometric_mappings;
CREATE POLICY "emp_biometric_mappings_select" ON employee_biometric_mappings FOR SELECT TO authenticated
USING (
  employee_id = (SELECT id FROM team_members WHERE email = auth.jwt()->>'email')
  OR
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

DROP POLICY IF EXISTS "emp_biometric_mappings_admin_modify" ON employee_biometric_mappings;
CREATE POLICY "emp_biometric_mappings_admin_modify" ON employee_biometric_mappings FOR ALL TO authenticated
USING (
  public.get_current_canonical_role() IN ('owner', 'admin')
)
WITH CHECK (
  public.get_current_canonical_role() IN ('owner', 'admin')
);

DROP POLICY IF EXISTS "attendance_events_admin_select" ON attendance_events;
CREATE POLICY "attendance_events_admin_select" ON attendance_events FOR SELECT TO authenticated
USING (
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

-- 3. Update Migration 048: Workforce Attendance Intelligence
DROP POLICY IF EXISTS "hr_holidays_admin_modify" ON hr_holidays;
CREATE POLICY "hr_holidays_admin_modify" ON hr_holidays FOR ALL TO authenticated
USING (
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
)
WITH CHECK (
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

-- 4. Update Migration 047: HR Leave and Shift Management (fix exact string matching bug)
DROP POLICY IF EXISTS "Leave types are modifiable by admins and hr" ON leave_types;
CREATE POLICY "Leave types are modifiable by admins and hr" ON leave_types FOR ALL USING (
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

DROP POLICY IF EXISTS "Employees can view own leave balances" ON leave_balances;
CREATE POLICY "Employees can view own leave balances" ON leave_balances FOR SELECT USING (
  employee_id IN (SELECT id FROM team_members WHERE email = auth.jwt()->>'email') OR
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

DROP POLICY IF EXISTS "Admins can modify leave balances" ON leave_balances;
CREATE POLICY "Admins can modify leave balances" ON leave_balances FOR ALL USING (
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

DROP POLICY IF EXISTS "Employees can view own leave requests" ON leave_requests;
CREATE POLICY "Employees can view own leave requests" ON leave_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM team_members WHERE email = auth.jwt()->>'email') OR
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

DROP POLICY IF EXISTS "Admins can manage all leave requests" ON leave_requests;
CREATE POLICY "Admins can manage all leave requests" ON leave_requests FOR ALL USING (
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

DROP POLICY IF EXISTS "Admins can modify shifts" ON shifts;
CREATE POLICY "Admins can modify shifts" ON shifts FOR ALL USING (
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

DROP POLICY IF EXISTS "Employees can view own shifts" ON employee_shifts;
CREATE POLICY "Employees can view own shifts" ON employee_shifts FOR SELECT USING (
  employee_id IN (SELECT id FROM team_members WHERE email = auth.jwt()->>'email') OR
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

DROP POLICY IF EXISTS "Admins can modify employee shifts" ON employee_shifts;
CREATE POLICY "Admins can modify employee shifts" ON employee_shifts FOR ALL USING (
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

-- 5. Drop the old insecure function
DROP FUNCTION IF EXISTS public.get_canonical_role(text);

COMMIT;
