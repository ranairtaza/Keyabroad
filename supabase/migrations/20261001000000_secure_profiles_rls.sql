-- Fix insecure profiles RLS policies

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop insecure policies that allowed any authenticated user to update any profile
DROP POLICY IF EXISTS "Staff full access profiles" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON profiles;

-- Users can update their own profile
CREATE POLICY "profiles_update_own" 
  ON profiles 
  FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

-- Staff can manage all profiles
CREATE POLICY "profiles_all_staff"
  ON profiles
  FOR ALL
  TO authenticated
  USING (get_current_canonical_role() IS NOT NULL)
  WITH CHECK (get_current_canonical_role() IS NOT NULL);
