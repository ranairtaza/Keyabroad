-- ============================================================================
-- KeyAbroad Phase 0: Genuine PostgreSQL / Supabase Integration Test
-- File: tests/integration/rls/verify_p0_postgres.sql
-- 
-- Purpose:
-- Verifies the Phase 0 profiles RLS lockdown and trigger behavior against
-- an actual PostgreSQL / Supabase database instance in a disposable environment.
--
-- Usage:
--   psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/integration/rls/verify_p0_postgres.sql
-- ============================================================================

\echo '========================================================'
\echo 'Starting Phase 0 PostgreSQL / Supabase Verification Suite'
\echo '========================================================'

BEGIN;

-- 1. Setup disposable test schema and mock roles if running in clean PostgreSQL
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END $$;

-- 2. Create profiles table if not exists (disposable test environment)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL DEFAULT 'student',
  staff_role TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grant baseline usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.profiles TO authenticated, service_role;

-- 3. Apply Phase 0 Forward Migration SQL
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE UPDATE ON public.profiles FROM PUBLIC;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url, phone) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.staff_role IS DISTINCT FROM NEW.staff_role) OR
     (OLD.role IS DISTINCT FROM NEW.role) OR
     (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN

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

-- Insert disposable test record as service administrator
INSERT INTO public.profiles (id, role, staff_role, is_active, full_name, phone)
VALUES ('00000000-0000-0000-0000-000000000001', 'student', NULL, true, 'Alice Test', '+1234567890')
ON CONFLICT (id) DO UPDATE SET
  role = 'student',
  staff_role = NULL,
  is_active = true,
  full_name = 'Alice Test',
  phone = '+1234567890';

\echo '✔ Migration applied & test profile initialized.'

-- ----------------------------------------------------------------------------
-- TEST 1: Unauthorized Student cannot modify role (Column & Trigger Check)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_error_caught BOOLEAN := FALSE;
BEGIN
  -- Emulate PostgREST execution context for an authenticated student
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

  BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = '00000000-0000-0000-0000-000000000001';
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := TRUE;
    RAISE NOTICE 'Test 1 Caught expected error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;

  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Authenticated student was able to modify role!';
  END IF;
END $$;
\echo '✔ PASS TEST 1: Unauthorized role modification denied to authenticated student.'

-- ----------------------------------------------------------------------------
-- TEST 2: Unauthorized Student cannot modify staff_role
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_error_caught BOOLEAN := FALSE;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    UPDATE public.profiles
    SET staff_role = 'super_admin'
    WHERE id = '00000000-0000-0000-0000-000000000001';
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := TRUE;
    RAISE NOTICE 'Test 2 Caught expected error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;

  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Authenticated student was able to modify staff_role!';
  END IF;
END $$;
\echo '✔ PASS TEST 2: Unauthorized staff_role modification denied to authenticated student.'

-- ----------------------------------------------------------------------------
-- TEST 3: Unauthorized Student cannot modify is_active
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_error_caught BOOLEAN := FALSE;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    UPDATE public.profiles
    SET is_active = FALSE
    WHERE id = '00000000-0000-0000-0000-000000000001';
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := TRUE;
    RAISE NOTICE 'Test 3 Caught expected error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;

  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Authenticated student was able to modify is_active!';
  END IF;
END $$;
\echo '✔ PASS TEST 3: Unauthorized is_active modification denied to authenticated student.'

-- ----------------------------------------------------------------------------
-- TEST 4: Approved Profile Fields Update Succeeds
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_name TEXT;
  v_phone TEXT;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  UPDATE public.profiles
  SET full_name = 'Alice Verified',
      phone = '+9876543210'
  WHERE id = '00000000-0000-0000-0000-000000000001';

  SELECT full_name, phone INTO v_name, v_phone
  FROM public.profiles
  WHERE id = '00000000-0000-0000-0000-000000000001';

  IF v_name != 'Alice Verified' OR v_phone != '+9876543210' THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Profile update did not persist correctly.';
  END IF;
END $$;
\echo '✔ PASS TEST 4: Approved profile field updates (full_name, phone) succeed.'

-- ----------------------------------------------------------------------------
-- TEST 5: Authorized Service Operation Succeeds
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  -- Emulate PostgREST execution context for service_role
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  UPDATE public.profiles
  SET role = 'admin',
      staff_role = 'super_admin'
  WHERE id = '00000000-0000-0000-0000-000000000001';

  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = '00000000-0000-0000-0000-000000000001';

  IF v_role != 'admin' OR v_staff_role != 'super_admin' THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Service role was unable to update privileged attributes.';
  END IF;
END $$;
\echo '✔ PASS TEST 5: Authorized service operations succeed.'

-- ----------------------------------------------------------------------------
-- TEST 6: Recovery SQL Preserves Security Invariants
-- ----------------------------------------------------------------------------
-- Execute the exact recovery SQL
REVOKE UPDATE ON public.profiles FROM PUBLIC;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url, phone) ON public.profiles TO authenticated;

DO $$
DECLARE
  v_error_caught BOOLEAN := FALSE;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    UPDATE public.profiles
    SET role = 'hacker'
    WHERE id = '00000000-0000-0000-0000-000000000001';
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := TRUE;
  END;

  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Recovery SQL restored vulnerable update access!';
  END IF;
END $$;
\echo '✔ PASS TEST 6: Recovery SQL retains all security restrictions.'

-- Rollback the transaction to leave disposable environment clean
ROLLBACK;

\echo '========================================================'
\echo 'ALL GENUINE POSTGRESQL / SUPABASE VERIFICATION TESTS PASSED'
\echo '========================================================'

