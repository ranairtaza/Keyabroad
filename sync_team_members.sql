-- 1. Sync any existing auth users into team_members if they are not already there
INSERT INTO public.team_members (name, email, role, location, status)
SELECT 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as name,
    email,
    'New Employee' as role,
    'Main Office' as location,
    'active' as status
FROM auth.users
WHERE email NOT IN (SELECT email FROM public.team_members WHERE email IS NOT NULL);

-- 2. Create a function to automatically add new users to team_members when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user_team_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.team_members (name, email, role, location, status)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'New Employee',
        'Main Office',
        'active'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_team_member();
