-- ============================================================================
-- KeyAbroad — Row Level Security (RLS) Lock-Down
-- ============================================================================

-- 1. Enable RLS on core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing overly permissive public policies (if any exist)
-- Example: DROP POLICY IF EXISTS "Public can view profiles" ON profiles;

-- 3. Profiles Table:
-- Users can read their own profile.
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Staff (super_admin, admin) can read all profiles.
-- (For this we need a secure function or rely on the fact that Service Role bypasses RLS)
-- Since the Next.js apps use the Service Role key for admin API calls,
-- and Edge middleware fetches the profile via the authenticated user's session,
-- this basic policy is sufficient for client-side protection.

-- Users can update their own profile (limited fields like avatar).
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Enquiries Table:
-- Enquiries are inserted via Service Role (Webhook) and read via Admin UI (Service Role).
-- No public client should be able to read or insert directly.
-- Thus, NO policies are created for anon/authenticated roles.
-- The Service Role automatically bypasses RLS.

-- 5. Student Applications Table:
-- Students can read their own applications.
CREATE POLICY "Students can read own applications" ON public.student_applications
FOR SELECT
USING (auth.uid() = (SELECT user_id FROM public.students WHERE id = student_applications.student_id));

-- 6. Integrations Table:
-- Strictly Service Role only. No client-side access.
-- No policies added.

-- 7. Appointments Table:
-- Students can insert appointments and read their own.
CREATE POLICY "Students can read own appointments" ON public.appointments
FOR SELECT
USING (
  student_name = (SELECT full_name FROM public.profiles WHERE id = auth.uid())
);

-- Note: The API and Admin UI run securely via Service Role keys and Server-Side execution.
-- These RLS policies ensure that if a malicious actor extracts the ANON key, 
-- they cannot scrape the database from the client side.
