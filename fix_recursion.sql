DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END
$$;

-- Re-apply the clean, non-recursive policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff full access profiles" ON profiles FOR ALL TO authenticated USING (true);
