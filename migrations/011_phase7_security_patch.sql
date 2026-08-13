-- 011_phase7_security_patch.sql
-- Fixes vulnerability introduced in 006 where anon was granted direct table INSERT.
-- Explicitly configures RPC ownership and execution rights.
-- Note: Executing without an explicit transaction block to prevent deadlocks on live databases.

-- ============================================================================
-- 1. REMOVE DIRECT PUBLIC INSERT VULNERABILITY
-- ============================================================================
DROP POLICY IF EXISTS "Public can insert leads" ON crm_leads;
REVOKE INSERT ON public.crm_leads FROM anon;

-- ============================================================================
-- 2 & 3. EXPLICITLY CONFIGURE RPC OWNERSHIP AND GRANTS
-- ============================================================================
-- Use a dynamic block to apply grants and ownership to ALL overloaded signatures
-- of submit_public_lead, preventing parameter type mismatch errors (e.g. INT vs NUMERIC).
DO $$
DECLARE
    f_sig TEXT;
BEGIN
    FOR f_sig IN 
        SELECT p.oid::regprocedure::text 
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE p.proname = 'submit_public_lead' 
        AND n.nspname = 'public'
    LOOP
        EXECUTE 'ALTER FUNCTION ' || f_sig || ' OWNER TO postgres;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION ' || f_sig || ' TO anon;';
    END LOOP;
END $$;
