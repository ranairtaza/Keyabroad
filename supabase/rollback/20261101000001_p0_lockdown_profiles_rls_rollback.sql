-- ============================================================================
-- Safe Rollback & Recovery Procedure: 20261101000001_p0_lockdown_profiles_rls_rollback.sql
-- Dedicated Location: supabase/rollback/ (Outside supabase/migrations/)
-- Description: Emergency diagnostic, repair, and safe rollback procedure for public.profiles.
--
-- SECURITY INVARIANT:
-- Under NO circumstances does this recovery procedure restore unrestricted
-- table-level UPDATE privileges to authenticated users or PUBLIC.
-- Restrictions on 'role', 'staff_role', and 'is_active' MUST BE PRESERVED AT ALL TIMES.
-- ============================================================================

-- Step 1: Verification & Pre-flight Diagnostics
-- Confirm existing state and ensure RLS is enforced
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Ensure unrestricted table-level UPDATE remains revoked
-- DO NOT grant table-level UPDATE on public.profiles to authenticated or PUBLIC.
REVOKE UPDATE ON public.profiles FROM PUBLIC;
REVOKE UPDATE ON public.profiles FROM authenticated;

-- Step 3: Re-verify or re-establish explicit column-level grants
-- Only allow authenticated users to update safe, self-service profile fields.
-- Privileged columns (role, staff_role, is_active, created_at, id) are NEVER granted.
GRANT UPDATE (full_name, avatar_url, phone) ON public.profiles TO authenticated;

-- Step 4: Emergency Trigger Diagnostic & Re-installation
-- Hardened with SECURITY DEFINER and SET search_path = '' to prevent hijacking
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Strict guard against unauthorized manipulation of privileged security attributes
  IF (OLD.staff_role IS DISTINCT FROM NEW.staff_role) OR
     (OLD.role IS DISTINCT FROM NEW.role) OR
     (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN

    -- Only allow execution in service_role context
    IF current_user != 'service_role' AND (COALESCE(pg_catalog.current_setting('request.jwt.claim.role', true), '') != 'service_role') THEN
      RAISE EXCEPTION 'Access Denied: Mutating privileged profile attributes (role, staff_role, is_active) is restricted to service administrators.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- Step 5: Post-Recovery Integrity Verification Queries
-- Run these queries to prove the database is in a secure, non-vulnerable state:
--
-- 1. Verify no table-level UPDATE privilege exists for authenticated:
--    SELECT grantee, privilege_type
--    FROM information_schema.table_privileges
--    WHERE table_name = 'profiles' AND grantee = 'authenticated' AND privilege_type = 'UPDATE';
--    --> MUST RETURN 0 ROWS
--
-- 2. Verify column-level UPDATE privileges for authenticated:
--    SELECT column_name, privilege_type
--    FROM information_schema.column_privileges
--    WHERE table_name = 'profiles' AND grantee = 'authenticated' AND privilege_type = 'UPDATE';
--    --> MUST RETURN ONLY 'full_name', 'avatar_url', 'phone'
--
-- 3. Verify trigger existence:
--    SELECT trigger_name, event_manipulation, action_statement
--    FROM information_schema.triggers
--    WHERE event_object_table = 'profiles' AND trigger_name = 'trg_protect_profile_privileged_fields';
--    --> MUST RETURN 1 ROW
