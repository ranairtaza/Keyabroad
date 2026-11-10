-- ============================================================================
-- Migration: 20261101000001_p0_lockdown_profiles_rls.sql
-- Description: Phase 0 Critical Security Remediation - RLS Hardening for public.profiles
-- Authorizes explicit column UPDATE grants and establishes hardened defense-in-depth trigger
-- to prevent privilege escalation (role, staff_role, is_active tampering).
-- ============================================================================

-- Step 1: Ensure RLS is enforced
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Revoke table-wide UPDATE privileges from PUBLIC and authenticated roles
REVOKE UPDATE ON public.profiles FROM PUBLIC;
REVOKE UPDATE ON public.profiles FROM authenticated;

-- Step 3: Grant column-level UPDATE on safe, self-service profile fields only
GRANT UPDATE (full_name, avatar_url, phone) ON public.profiles TO authenticated;

-- Step 4: Defense-in-depth BEFORE UPDATE trigger
-- Hardened with SECURITY DEFINER and SET search_path = '' to prevent hijacking
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if privileged fields are being altered
  IF (OLD.staff_role IS DISTINCT FROM NEW.staff_role) OR
     (OLD.role IS DISTINCT FROM NEW.role) OR
     (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN

    -- Allow only trusted service_role execution contexts
    IF current_user != 'service_role' AND (COALESCE(pg_catalog.current_setting('request.jwt.claim.role', true), '') != 'service_role') THEN
      RAISE EXCEPTION 'Access Denied: Mutating privileged profile attributes (role, staff_role, is_active) is restricted to service administrators.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 5: Attach trigger to public.profiles
DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_fields();
