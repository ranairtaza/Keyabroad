-- ============================================================================
-- MIGRATION 001: SECURITY HARDENING
-- ============================================================================
-- PURPOSE: Fix dangerous RLS policies that expose sensitive data publicly.
-- IMPACT: team_members, follow_ups, appointments, notifications, activity_logs
-- RUN IN: Supabase SQL Editor → SQL Editor → New Query
-- 
-- IMPORTANT: This is a NON-DESTRUCTIVE migration. It replaces existing policies
-- without modifying table structures or deleting any data.
-- ============================================================================

-- ============================================================================
-- 1. TEAM MEMBERS — Restrict to authenticated only (contains salary data)
-- ============================================================================
DROP POLICY IF EXISTS "Enable all for public" ON team_members;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON team_members;

-- Staff can read all team members
CREATE POLICY "team_members_select_authenticated"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

-- Only admins should insert/update/delete (enforced at app level for now)
CREATE POLICY "team_members_modify_authenticated"
  ON team_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. FOLLOW-UPS — Restrict to authenticated only
-- ============================================================================
DROP POLICY IF EXISTS "Enable all for public on follow_ups" ON follow_ups;

CREATE POLICY "follow_ups_all_authenticated"
  ON follow_ups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. APPOINTMENTS — Restrict reads to authenticated, allow public inserts
-- ============================================================================
DROP POLICY IF EXISTS "Enable all for public on appointments" ON appointments;

-- Public can book appointments (INSERT only)
CREATE POLICY "appointments_insert_public"
  ON appointments FOR INSERT
  TO public
  WITH CHECK (true);

-- Staff can see and manage all appointments
CREATE POLICY "appointments_all_authenticated"
  ON appointments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. NOTIFICATIONS — Restrict to authenticated only
-- ============================================================================
DROP POLICY IF EXISTS "Enable all for public on notifications" ON notifications;

-- Authenticated users can manage notifications
CREATE POLICY "notifications_all_authenticated"
  ON notifications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. ACTIVITY LOGS — Restrict to authenticated only
-- ============================================================================
DROP POLICY IF EXISTS "Enable all for public on activity_logs" ON activity_logs;

-- Authenticated users can read and write activity logs
CREATE POLICY "activity_logs_all_authenticated"
  ON activity_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 6. UNIVERSITIES — Allow public reads, restrict writes to authenticated
-- ============================================================================
DROP POLICY IF EXISTS "Enable all for public on universities" ON universities;
DROP POLICY IF EXISTS "Enable all for authenticated users on universities" ON universities;

-- Anyone can browse universities (public website feature)
CREATE POLICY "universities_select_public"
  ON universities FOR SELECT
  TO public
  USING (true);

-- Only staff can modify university data
CREATE POLICY "universities_modify_authenticated"
  ON universities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 7. EMPLOYEE ATTENDANCE — Restrict reads to authenticated
-- ============================================================================
DROP POLICY IF EXISTS "Enable select for public" ON employee_attendance;

-- Keep public insert for check-in kiosk use
-- Add authenticated-only select
CREATE POLICY "attendance_select_authenticated"
  ON employee_attendance FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 8. WEBSITE VISITS — Keep public insert, restrict select to authenticated
-- ============================================================================
DROP POLICY IF EXISTS "Enable select for public" ON website_visits;

CREATE POLICY "website_visits_select_authenticated"
  ON website_visits FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 9. INTEGRATIONS — Verify authenticated-only (contains API keys!)
-- ============================================================================
-- This table already has authenticated-only policies from phase4_migration.
-- No changes needed, but verify it's not publicly accessible:
DROP POLICY IF EXISTS "Enable all for public" ON integrations;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after the migration to confirm)
-- ============================================================================
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
