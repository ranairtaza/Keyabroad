-- =================================================================================
-- PHASE 6C: SECURITY IDENTITY MIGRATION
-- =================================================================================

-- 1. Add auth_user_id to team_members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_auth_user_id ON public.team_members(auth_user_id);

-- 2. Deterministic Backfill
-- Backfill deterministically from exact authenticated email matches only
UPDATE public.team_members tm
SET auth_user_id = au.id
FROM auth.users au
WHERE tm.email = au.email
  AND tm.auth_user_id IS NULL;

-- 3. Update Canonical Role Function to use auth_user_id
CREATE OR REPLACE FUNCTION public.get_current_canonical_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN lower(trim(role)) IN ('owner', 'super_admin', 'super admin') THEN 'owner'
      WHEN lower(trim(role)) = 'admin' THEN 'admin'
      WHEN lower(trim(role)) IN ('hr', 'hr manager') THEN 'hr'
      WHEN lower(trim(role)) = 'operations head' THEN 'operations head'
      ELSE 'employee'
    END
  FROM team_members
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;
