-- Complete Fix for Team Directory Visibility

-- 1. Ensure the anonymous website user actually has SQL permission to read the table
GRANT SELECT ON public.team_members TO anon;
GRANT SELECT ON public.team_members TO authenticated;

-- 2. Drop any faulty public policies we created earlier
DROP POLICY IF EXISTS "Public read active team members" ON public.team_members;

-- 3. Create a bulletproof policy explicitly for the 'anon' role (public website visitors)
CREATE POLICY "Public read active team members"
  ON public.team_members
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');
