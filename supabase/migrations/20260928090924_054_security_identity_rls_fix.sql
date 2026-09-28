-- =================================================================================
-- PHASE 6C: ROW LEVEL SECURITY HARDENING (FINAL IDENTITY FIX)
-- =================================================================================

BEGIN;

-- 1. employee_biometric_mappings
DROP POLICY IF EXISTS "emp_biometric_mappings_select" ON employee_biometric_mappings;
CREATE POLICY "emp_biometric_mappings_select" ON employee_biometric_mappings FOR SELECT TO authenticated
USING (
  employee_id = (SELECT id FROM team_members WHERE auth_user_id = auth.uid())
  OR
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

-- 2. leave_balances
DROP POLICY IF EXISTS "Employees can view own leave balances" ON leave_balances;
CREATE POLICY "Employees can view own leave balances" ON leave_balances FOR SELECT USING (
  employee_id IN (SELECT id FROM team_members WHERE auth_user_id = auth.uid()) OR
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

-- 3. leave_requests
DROP POLICY IF EXISTS "Employees can view own leave requests" ON leave_requests;
CREATE POLICY "Employees can view own leave requests" ON leave_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM team_members WHERE auth_user_id = auth.uid()) OR
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

-- 4. employee_shifts
DROP POLICY IF EXISTS "Employees can view own shifts" ON employee_shifts;
CREATE POLICY "Employees can view own shifts" ON employee_shifts FOR SELECT USING (
  employee_id IN (SELECT id FROM team_members WHERE auth_user_id = auth.uid()) OR
  public.get_current_canonical_role() IN ('owner', 'admin', 'hr', 'operations head')
);

COMMIT;
