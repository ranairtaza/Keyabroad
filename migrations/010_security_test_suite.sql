-- 010_security_test_suite.sql
-- Comprehensive SQL tests verifying explicit Positive/Negative Auth, IDORs, Privilege Escalations, and Idempotency.

BEGIN;

-- ============================================================================
-- 0. HARNESS INITIALIZATION & 1. TEMPORARY AUTH IDENTITIES
-- ============================================================================
CREATE TEMP TABLE test_state (key TEXT PRIMARY KEY, val UUID, text_val TEXT);

DO $$
DECLARE
    student_a UUID := gen_random_uuid();
    student_b UUID := gen_random_uuid();
    counselor_a UUID := gen_random_uuid();
    counselor_b UUID := gen_random_uuid();
    admission_officer UUID := gen_random_uuid();
    visa_officer UUID := gen_random_uuid();
    admin_uuid UUID := gen_random_uuid();
    super_admin_uuid UUID := gen_random_uuid();
    
    student_a_profile UUID;
    student_b_profile UUID;
    lead_a UUID;
    lead_b UUID;
    app_a UUID;
    app_b UUID;
    uni_1 UUID;
    uni_2 UUID;
    prog_1 UUID;
    prog_2 UUID;
    schol_1 UUID;
    schol_2 UUID;
BEGIN
    -- Auth explicitly mapped matching referential integrity against auth.users
    INSERT INTO auth.users (id, aud, role, email) VALUES 
        (student_a, 'authenticated', 'authenticated', 'studentA@local'),
        (student_b, 'authenticated', 'authenticated', 'studentB@local'),
        (counselor_a, 'authenticated', 'authenticated', 'counselorA@local'),
        (counselor_b, 'authenticated', 'authenticated', 'counselorB@local'),
        (admission_officer, 'authenticated', 'authenticated', 'admissions@local'),
        (visa_officer, 'authenticated', 'authenticated', 'visa@local'),
        (admin_uuid, 'authenticated', 'authenticated', 'admin@local'),
        (super_admin_uuid, 'authenticated', 'authenticated', 'super@local');

    INSERT INTO profiles (id, role, staff_role, first_name, last_name, email) VALUES 
        (student_a, 'student', NULL, 'Student', 'A', 'studentA@local'),
        (student_b, 'student', NULL, 'Student', 'B', 'studentB@local'),
        (counselor_a, 'staff', 'counselor', 'Counselor', 'A', 'counselorA@local'),
        (counselor_b, 'staff', 'counselor', 'Counselor', 'B', 'counselorB@local'),
        (admission_officer, 'staff', 'admission_officer', 'Admissions', 'Officer', 'admissions@local'),
        (visa_officer, 'staff', 'visa_officer', 'Visa', 'Officer', 'visa@local'),
        (admin_uuid, 'staff', 'admin', 'Admin', 'User', 'admin@local'),
        (super_admin_uuid, 'staff', 'super_admin', 'Super', 'Admin', 'super@local');

    INSERT INTO students (user_id, first_name, last_name) VALUES 
        (student_a, 'Student', 'A') RETURNING id INTO student_a_profile;
    INSERT INTO students (user_id, first_name, last_name) VALUES 
        (student_b, 'Student', 'B') RETURNING id INTO student_b_profile;

    -- 2. CREATE CONTROLLED TEST FIXTURES
    INSERT INTO crm_leads (first_name, last_name, email, assigned_counselor_id) VALUES 
        ('Lead', 'A', 'a@local', counselor_a) RETURNING id INTO lead_a;
    INSERT INTO crm_leads (first_name, last_name, email, assigned_counselor_id) VALUES 
        ('Lead', 'B', 'b@local', counselor_b) RETURNING id INTO lead_b;

    INSERT INTO student_applications (student_id, managed_by, admission_officer_id, visa_officer_id, status) VALUES 
        (student_a_profile, counselor_a, admission_officer, visa_officer, 'draft') RETURNING id INTO app_a;
    INSERT INTO student_applications (student_id, managed_by, admission_officer_id, visa_officer_id, status) VALUES 
        (student_b_profile, counselor_b, NULL, NULL, 'draft') RETURNING id INTO app_b;

    INSERT INTO universities (name, slug, status, verification_status) VALUES ('Uni 1', 'uni-1', 'published', 'verified') RETURNING id INTO uni_1;
    INSERT INTO universities (name, slug, status, verification_status) VALUES ('Uni 2', 'uni-2', 'draft', 'unverified') RETURNING id INTO uni_2;
    
    INSERT INTO programs (university_id, name, slug, status, verification_status) VALUES (uni_1, 'Prog 1', 'prog-1', 'published', 'verified') RETURNING id INTO prog_1;
    INSERT INTO programs (university_id, name, slug, status, verification_status) VALUES (uni_2, 'Prog 2', 'prog-2', 'draft', 'unverified') RETURNING id INTO prog_2;
    
    INSERT INTO scholarships (name, slug, status, verification_status) VALUES ('Schol 1', 'schol-1', 'published', 'verified') RETURNING id INTO schol_1;
    INSERT INTO scholarships (name, slug, status, verification_status) VALUES ('Schol 2', 'schol-2', 'draft', 'unverified') RETURNING id INTO schol_2;

    -- Insert Mock AI Vectors for Invalidation Tests
    INSERT INTO knowledge_embeddings (source_record_id, source_type, content, verification_status) VALUES
        (uni_1, 'universities', 'Uni 1 AI Context', 'verified'),
        (prog_1, 'programs', 'Prog 1 AI Context', 'verified'),
        (schol_1, 'scholarships', 'Schol 1 AI Context', 'verified');

    INSERT INTO test_state (key, val, text_val) VALUES
        ('student_a', student_a, NULL), ('student_b', student_b, NULL), 
        ('counselor_a', counselor_a, NULL), ('counselor_b', counselor_b, NULL),
        ('admission_officer', admission_officer, NULL), ('visa_officer', visa_officer, NULL), 
        ('admin_uuid', admin_uuid, NULL), ('super_admin_uuid', super_admin_uuid, NULL), 
        ('app_a', app_a, NULL), ('app_b', app_b, NULL), ('lead_a', lead_a, NULL),
        ('lead_b', lead_b, NULL), ('student_a_profile', student_a_profile, NULL), 
        ('uni_1', uni_1, NULL), ('uni_2', uni_2, NULL), ('prog_1', prog_1, NULL), 
        ('prog_2', prog_2, NULL), ('schol_1', schol_1, NULL), ('schol_2', schol_2, NULL),
        ('rpc_email', NULL, 'rpc_' || gen_random_uuid()::text || '@local');
END $$;

-- ============================================================================
-- 3. AUTHENTICATION ASSERTIONS & 4. ANONYMOUS SECURITY TESTS
-- ============================================================================
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '', true);

DO $$
DECLARE
    v_rpc_email TEXT := (SELECT text_val FROM test_state WHERE key = 'rpc_email');
    v_returned_rpc_id UUID;
    failed BOOLEAN := false;
BEGIN
    -- Anonymous Insert Tampering (Expected: 42501 Insufficient Privilege)
    BEGIN
        INSERT INTO crm_leads (first_name, last_name, email) VALUES ('Hacker', 'Man', 'hack@local');
        failed := true;
    EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Anonymous insert into crm_leads bypassed RLS.'; END IF;
    
    -- Anonymous Catalog Mutation Tests
    failed := false;
    BEGIN
        INSERT INTO universities (name, slug, status, verification_status) VALUES ('Hack', 'hack', 'published', 'verified');
        failed := true;
    EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Anonymous catalog mutation allowed.'; END IF;

    -- 16. PUBLIC LEAD RPC TEST (Submission as anon)
    v_returned_rpc_id := submit_public_lead('Test', 'RPC', v_rpc_email, '123', 3.0, 6.0, 0, 10000, NULL::UUID);
    IF v_returned_rpc_id IS NULL THEN RAISE EXCEPTION 'FAIL: submit_public_lead returned NULL.'; END IF;
END $$;

-- 16 (CONTINUED). PUBLIC LEAD RPC TESTS: privileged verification
SET LOCAL ROLE postgres;
DO $$
DECLARE
    v_rpc_email TEXT := (SELECT text_val FROM test_state WHERE key = 'rpc_email');
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM crm_leads WHERE email = v_rpc_email;
    IF v_count != 1 THEN RAISE EXCEPTION 'FAIL: Public lead RPC failed to properly record lead.'; END IF;
END $$;

-- ============================================================================
-- 15. AI EMBEDDING ISOLATION TESTS (Anon & Authenticated)
-- ============================================================================
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '', true);
DO $$
DECLARE
    failed BOOLEAN := false;
    dummy_count INT;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO dummy_count FROM knowledge_embeddings;
        failed := true;
    EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: AI Vector exposure to anonymous public allowed.'; END IF;
END $$;

SET LOCAL ROLE authenticated;
DO $$
DECLARE
    v_user UUID := (SELECT val FROM test_state WHERE key = 'student_a');
    failed BOOLEAN := false;
    dummy_count INT;
BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_user), true);
    BEGIN
        SELECT COUNT(*) INTO dummy_count FROM knowledge_embeddings;
        failed := true;
    EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: AI Vector exposure to authenticated users allowed.'; END IF;
END $$;

-- ============================================================================
-- 5. STUDENT A/B IDOR & ROLE SPOOFING TESTS
-- ============================================================================
SET LOCAL ROLE authenticated;
DO $$
DECLARE
    v_count INT;
    v_rows INT;
    v_user UUID := (SELECT val FROM test_state WHERE key = 'student_a');
    v_app_a UUID := (SELECT val FROM test_state WHERE key = 'app_a');
    v_app_b UUID := (SELECT val FROM test_state WHERE key = 'app_b');
BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_user), true);

    -- Student A reads own app
    SELECT COUNT(*) INTO v_count FROM student_applications WHERE id = v_app_a;
    IF v_count != 1 THEN RAISE EXCEPTION 'FAIL: Student A cannot read own application.'; END IF;

    -- Student A reads Student B's app (IDOR vulnerability)
    SELECT COUNT(*) INTO v_count FROM student_applications WHERE id = v_app_b;
    IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Student A can read Student B application (IDOR vulnerability).'; END IF;


    -- Role Spoofing Check: Student attempts to update university (Admin action)
    UPDATE universities SET status = 'published' WHERE TRUE;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN RAISE EXCEPTION 'FAIL: Student A executed role-spoofed admin catalog mutation.'; END IF;

    -- Field-Level Trigger Check: Student attempts to mutate status beyond 'submitted' (Throws P0001)
    failed := false;
    BEGIN
        UPDATE student_applications SET status = 'accepted' WHERE id = v_app_a;
        failed := true;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Student A bypassed field-level boundary to mutate admission status (Trigger Failed).'; END IF;
END $$;

-- ============================================================================
-- 6. COUNSELOR A/B IDOR TESTS & DELETE TESTS
-- ============================================================================
SET LOCAL ROLE authenticated;
DO $$
DECLARE
    v_count INT;
    v_rows INT;
    v_user UUID := (SELECT val FROM test_state WHERE key = 'counselor_a');
    v_lead_a UUID := (SELECT val FROM test_state WHERE key = 'lead_a');
    v_lead_b UUID := (SELECT val FROM test_state WHERE key = 'lead_b');
BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_user), true);

    -- Read tests
    SELECT COUNT(*) INTO v_count FROM crm_leads WHERE id = v_lead_a;
    IF v_count != 1 THEN RAISE EXCEPTION 'FAIL: Counselor A cannot read own lead.'; END IF;
    SELECT COUNT(*) INTO v_count FROM crm_leads WHERE id = v_lead_b;
    IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Counselor A can read Counselor B lead (IDOR vulnerability).'; END IF;

    -- UPDATE IDOR: Counselor A tries to update Counselor B's lead
    UPDATE crm_leads SET first_name = 'Hacked' WHERE id = v_lead_b;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN RAISE EXCEPTION 'FAIL: Counselor A updated Counselor B lead (UPDATE IDOR vulnerability).'; END IF;

    -- DELETE IDOR: Counselor A tries to delete Counselor B's lead
    DELETE FROM crm_leads WHERE id = v_lead_b;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN RAISE EXCEPTION 'FAIL: Counselor A deleted Counselor B lead (DELETE IDOR vulnerability).'; END IF;
END $$;

-- ============================================================================
-- 12. CRM OWNERSHIP & 13. APPLICATION OWNERSHIP TESTS (ESCALATION)
-- ============================================================================
SET LOCAL ROLE authenticated;
DO $$
DECLARE
    v_user UUID := (SELECT val FROM test_state WHERE key = 'counselor_a');
    v_counselor_b UUID := (SELECT val FROM test_state WHERE key = 'counselor_b');
    v_lead_a UUID := (SELECT val FROM test_state WHERE key = 'lead_a');
    v_app_a UUID := (SELECT val FROM test_state WHERE key = 'app_a');
    failed BOOLEAN := false;
BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_user), true);
    
    -- TRIGGER BLOCK: Attempt to escalate assigned_counselor_id on OWN lead (Throws P0001)
    BEGIN
        UPDATE crm_leads SET assigned_counselor_id = v_counselor_b WHERE id = v_lead_a;
        failed := true;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Counselor successfully escalated assigned_counselor_id on own lead (Trigger Bypassed).'; END IF;

    -- TRIGGER BLOCK: Attempt to escalate managed_by on OWN application (Throws P0001)
    failed := false;
    BEGIN
        UPDATE student_applications SET managed_by = v_counselor_b WHERE id = v_app_a;
        failed := true;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Counselor successfully escalated managed_by ownership (Trigger Bypassed).'; END IF;

    -- TRIGGER BLOCK: Counselor attempts to mutate visa_status (Throws P0001)
    failed := false;
    BEGIN
        UPDATE student_applications SET visa_status = 'approved' WHERE id = v_app_a;
        failed := true;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Counselor successfully mutated visa_status (Trigger Bypassed).'; END IF;
END $$;

-- ============================================================================
-- 7. ADMISSION OFFICER TESTS
-- ============================================================================
SET LOCAL ROLE authenticated;
DO $$
DECLARE
    v_user UUID := (SELECT val FROM test_state WHERE key = 'admission_officer');
    v_app_a UUID := (SELECT val FROM test_state WHERE key = 'app_a');
    failed BOOLEAN := false;
    v_status TEXT;
    v_rows INT;
BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_user), true);
    
    UPDATE student_applications SET status = 'under_review' WHERE id = v_app_a RETURNING status INTO v_status;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows != 1 OR v_status != 'under_review' THEN RAISE EXCEPTION 'FAIL: Admission Officer positive update failed or affected wrong rows.'; END IF;
    
    BEGIN
        UPDATE student_applications SET managed_by = v_user WHERE id = v_app_a;
        failed := true;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Admission Officer bypassed application ownership bounds.'; END IF;

    -- TRIGGER BLOCK: Admission Officer attempts to mutate visa_status (Throws P0001)
    failed := false;
    BEGIN
        UPDATE student_applications SET visa_status = 'approved' WHERE id = v_app_a;
        failed := true;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Admission Officer successfully mutated visa_status (Field Isolation Bypassed).'; END IF;
END $$;

-- ============================================================================
-- 8. VISA OFFICER TESTS
-- ============================================================================
SET LOCAL ROLE authenticated;
DO $$
DECLARE
    v_user UUID := (SELECT val FROM test_state WHERE key = 'visa_officer');
    v_app_a UUID := (SELECT val FROM test_state WHERE key = 'app_a');
    failed BOOLEAN := false;
    v_visa_status TEXT;
    v_rows INT;
BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_user), true);
    
    UPDATE student_applications SET visa_status = 'approved' WHERE id = v_app_a RETURNING visa_status INTO v_visa_status;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows != 1 OR v_visa_status != 'approved' THEN RAISE EXCEPTION 'FAIL: Visa Officer positive update failed or affected wrong rows.'; END IF;
    
    BEGIN
        UPDATE student_applications SET managed_by = v_user WHERE id = v_app_a;
        failed := true;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Visa Officer bypassed application ownership bounds.'; END IF;

    -- TRIGGER BLOCK: Visa Officer attempts to mutate admission status (Throws P0001)
    failed := false;
    BEGIN
        UPDATE student_applications SET status = 'accepted' WHERE id = v_app_a;
        failed := true;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Visa Officer successfully mutated admission status (Field Isolation Bypassed).'; END IF;
END $$;

-- ============================================================================
-- 9. ADMIN TESTS & 10. SUPER ADMIN TESTS
-- ============================================================================
SET LOCAL ROLE authenticated;
DO $$
DECLARE
    v_user UUID := (SELECT val FROM test_state WHERE key = 'admin_uuid');
    v_counselor_b UUID := (SELECT val FROM test_state WHERE key = 'counselor_b');
    v_app_a UUID := (SELECT val FROM test_state WHERE key = 'app_a');
    v_updated_managed_by UUID;
    v_rows INT;
BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_user), true);
    
    UPDATE student_applications SET managed_by = v_counselor_b WHERE id = v_app_a RETURNING managed_by INTO v_updated_managed_by;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows != 1 OR v_updated_managed_by != v_counselor_b THEN RAISE EXCEPTION 'FAIL: Admin override of application ownership failed.'; END IF;
END $$;

SET LOCAL ROLE authenticated;
DO $$
DECLARE
    v_user UUID := (SELECT val FROM test_state WHERE key = 'super_admin_uuid');
    v_counselor_b UUID := (SELECT val FROM test_state WHERE key = 'counselor_b');
    v_lead_a UUID := (SELECT val FROM test_state WHERE key = 'lead_a');
    v_updated_assigned UUID;
    v_rows INT;
BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_user), true);
    
    UPDATE crm_leads SET assigned_counselor_id = v_counselor_b WHERE id = v_lead_a RETURNING assigned_counselor_id INTO v_updated_assigned;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows != 1 OR v_updated_assigned != v_counselor_b THEN RAISE EXCEPTION 'FAIL: Super Admin override of lead ownership failed.'; END IF;
END $$;

-- ============================================================================
-- 11. CATALOG RLS TESTS (Universities, Programs, Scholarships)
-- ============================================================================
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '', true);
DO $$
DECLARE
    v_uni_1 UUID := (SELECT val FROM test_state WHERE key = 'uni_1');
    v_uni_2 UUID := (SELECT val FROM test_state WHERE key = 'uni_2');
    v_prog_1 UUID := (SELECT val FROM test_state WHERE key = 'prog_1');
    v_prog_2 UUID := (SELECT val FROM test_state WHERE key = 'prog_2');
    v_schol_1 UUID := (SELECT val FROM test_state WHERE key = 'schol_1');
    v_schol_2 UUID := (SELECT val FROM test_state WHERE key = 'schol_2');
    v_count INT;
BEGIN
    -- Universities
    SELECT COUNT(*) INTO v_count FROM universities WHERE id = v_uni_1;
    IF v_count != 1 THEN RAISE EXCEPTION 'FAIL: Public cannot read published university fixture.'; END IF;
    SELECT COUNT(*) INTO v_count FROM universities WHERE id = v_uni_2;
    IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Public can read draft university fixture.'; END IF;

    -- Programs
    SELECT COUNT(*) INTO v_count FROM programs WHERE id = v_prog_1;
    IF v_count != 1 THEN RAISE EXCEPTION 'FAIL: Public cannot read published program fixture.'; END IF;
    SELECT COUNT(*) INTO v_count FROM programs WHERE id = v_prog_2;
    IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Public can read draft program fixture.'; END IF;

    -- Scholarships
    SELECT COUNT(*) INTO v_count FROM scholarships WHERE id = v_schol_1;
    IF v_count != 1 THEN RAISE EXCEPTION 'FAIL: Public cannot read published scholarship fixture.'; END IF;
    SELECT COUNT(*) INTO v_count FROM scholarships WHERE id = v_schol_2;
    IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Public can read draft scholarship fixture.'; END IF;
END $$;

-- ============================================================================
-- 14. AUDIT TAMPERING & VERIFICATION TESTS
-- ============================================================================
SET LOCAL ROLE authenticated;
DO $$
DECLARE
    v_counselor UUID := (SELECT val FROM test_state WHERE key = 'counselor_a');
    failed BOOLEAN := false;
BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_counselor), true);
    
    -- Negative: Tamper INSERT (Forged actor bypass)
    BEGIN
        INSERT INTO audit_logs (actor_id, action) VALUES (gen_random_uuid(), 'HACK');
        failed := true;
    EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Audit log INSERT tampering (forged actor bypass) allowed.'; END IF;
    
    -- Negative: Tamper UPDATE
    failed := false;
    BEGIN
        UPDATE audit_logs SET action = 'HACK' WHERE TRUE;
        failed := true;
    EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Audit log UPDATE tampering bypassed RLS.'; END IF;

    -- Negative: Tamper DELETE
    failed := false;
    BEGIN
        DELETE FROM audit_logs;
        failed := true;
    EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Audit log DELETE tampering bypassed RLS.'; END IF;
END $$;

-- Positive Audit Trace Verification (Super Admin creates real logs)
SET LOCAL ROLE postgres;
DO $$
DECLARE
    v_user UUID := (SELECT val FROM test_state WHERE key = 'super_admin_uuid');
    v_new_uni UUID;
    v_audit_id UUID;
    v_actor_id UUID;
    v_entity_type TEXT;
    v_action TEXT;
    v_old JSONB;
    v_new JSONB;
BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_user), true);
    
    -- INSERT Audit Test
    INSERT INTO universities (name, slug, status, verification_status) VALUES ('Audit Insert Uni', 'audit-uni', 'draft', 'unverified') RETURNING id INTO v_new_uni;
    SELECT id, actor_id, entity_type, action, old_data, new_data INTO v_audit_id, v_actor_id, v_entity_type, v_action, v_old, v_new FROM audit_logs WHERE entity_id = v_new_uni AND action = 'INSERT' ORDER BY created_at DESC LIMIT 1;
    IF v_audit_id IS NULL OR v_actor_id != v_user OR v_entity_type != 'universities' THEN 
        RAISE EXCEPTION 'FAIL: Audit INSERT trigger did not record event with valid metadata.'; 
    END IF;
    
    -- UPDATE Audit Test
    UPDATE universities SET name = 'Updated Audit Uni' WHERE id = v_new_uni;
    SELECT id, actor_id, entity_type, action, old_data, new_data INTO v_audit_id, v_actor_id, v_entity_type, v_action, v_old, v_new FROM audit_logs WHERE entity_id = v_new_uni AND action = 'UPDATE' ORDER BY created_at DESC LIMIT 1;
    IF v_audit_id IS NULL OR v_actor_id != v_user OR v_entity_type != 'universities' OR v_old->>'name' != 'Audit Insert Uni' OR v_new->>'name' != 'Updated Audit Uni' THEN 
        RAISE EXCEPTION 'FAIL: Audit UPDATE trigger did not correctly serialize OLD/NEW states with valid metadata.'; 
    END IF;

    -- DELETE Audit Test
    DELETE FROM universities WHERE id = v_new_uni;
    SELECT id, actor_id, entity_type, action, old_data, new_data INTO v_audit_id, v_actor_id, v_entity_type, v_action, v_old, v_new FROM audit_logs WHERE entity_id = v_new_uni AND action = 'DELETE' ORDER BY created_at DESC LIMIT 1;
    IF v_audit_id IS NULL OR v_actor_id != v_user OR v_entity_type != 'universities' OR v_old->>'name' != 'Updated Audit Uni' OR v_new IS NOT NULL THEN 
        RAISE EXCEPTION 'FAIL: Audit DELETE trigger failed to record OLD state, zeroed NEW state, or metadata.'; 
    END IF;
END $$;

-- ============================================================================
-- AI INVALIDATION TESTS
-- ============================================================================
SET LOCAL ROLE postgres;
DO $$
DECLARE
    v_uni_1 UUID := (SELECT val FROM test_state WHERE key = 'uni_1');
    v_prog_1 UUID := (SELECT val FROM test_state WHERE key = 'prog_1');
    v_schol_1 UUID := (SELECT val FROM test_state WHERE key = 'schol_1');
    v_ai_status TEXT;
    v_source_type TEXT;
BEGIN
    UPDATE universities SET ranking = 1 WHERE id = v_uni_1;
    UPDATE programs SET tuition_fee = 500 WHERE id = v_prog_1;
    UPDATE scholarships SET amount = 1000 WHERE id = v_schol_1;

    SELECT verification_status, source_type INTO v_ai_status, v_source_type FROM knowledge_embeddings WHERE source_record_id = v_uni_1 AND source_type = 'universities';
    IF v_ai_status != 'needs_update' OR v_source_type != 'universities' THEN RAISE EXCEPTION 'FAIL: University update did not invalidate AI embedding.'; END IF;

    SELECT verification_status, source_type INTO v_ai_status, v_source_type FROM knowledge_embeddings WHERE source_record_id = v_prog_1 AND source_type = 'programs';
    IF v_ai_status != 'needs_update' OR v_source_type != 'programs' THEN RAISE EXCEPTION 'FAIL: Program update did not invalidate AI embedding.'; END IF;

    SELECT verification_status, source_type INTO v_ai_status, v_source_type FROM knowledge_embeddings WHERE source_record_id = v_schol_1 AND source_type = 'scholarships';
    IF v_ai_status != 'needs_update' OR v_source_type != 'scholarships' THEN RAISE EXCEPTION 'FAIL: Scholarship update did not invalidate AI embedding.'; END IF;
END $$;

-- ============================================================================
-- 17. ELIGIBILITY IDEMPOTENCY TESTS
-- ============================================================================
SET LOCAL ROLE postgres; 
DO $$
DECLARE
    v_count INT;
BEGIN
    INSERT INTO eligibility_rules (rule_type, operator, value_numeric, value_text) VALUES ('ielts', '>=', 9.9, NULL) ON CONFLICT ON CONSTRAINT uq_eligibility_rules DO NOTHING;
    INSERT INTO eligibility_rules (rule_type, operator, value_numeric, value_text) VALUES ('ielts', '>=', 9.9, NULL) ON CONFLICT ON CONSTRAINT uq_eligibility_rules DO NOTHING;
    
    SELECT COUNT(*) INTO v_count FROM eligibility_rules WHERE rule_type = 'ielts' AND value_numeric = 9.9;
    IF v_count != 1 THEN RAISE EXCEPTION 'FAIL: Idempotency test generated duplicates (Count: %)', v_count; END IF;
END $$;

-- ============================================================================
-- 18. SHORTLIST INTEGRITY TESTS & 19. PROGRAM/UNIVERSITY INTEGRITY
-- ============================================================================
SET LOCAL ROLE postgres;
DO $$
DECLARE
    v_student_profile UUID := (SELECT val FROM test_state WHERE key = 'student_a_profile');
    v_prog_1 UUID := (SELECT val FROM test_state WHERE key = 'prog_1');
    v_prog_2 UUID := (SELECT val FROM test_state WHERE key = 'prog_2');
    v_uni_1 UUID := (SELECT val FROM test_state WHERE key = 'uni_1');
    v_uni_2 UUID := (SELECT val FROM test_state WHERE key = 'uni_2');
    v_nonexistent UUID := gen_random_uuid();
    failed BOOLEAN := false;
BEGIN
    -- Empty target (Expected: Check Violation 23514)
    BEGIN
        INSERT INTO student_shortlists (student_id) VALUES (v_student_profile);
        failed := true;
    EXCEPTION WHEN SQLSTATE '23514' THEN NULL; END; 
    IF failed THEN RAISE EXCEPTION 'FAIL: Inserted shortlist with empty target.'; END IF;

    -- Mismatching program to university (Expected: Trigger Exception P0001)
    failed := false;
    BEGIN
        INSERT INTO student_shortlists (student_id, program_id, university_id) VALUES (v_student_profile, v_prog_1, v_uni_2);
        failed := true;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END; 
    IF failed THEN RAISE EXCEPTION 'FAIL: Inserted mismatching program/university shortlist.'; END IF;

    -- Non-existent program id (Expected: Trigger Exception P0001)
    failed := false;
    BEGIN
        INSERT INTO student_shortlists (student_id, program_id, university_id) VALUES (v_student_profile, v_nonexistent, v_uni_1);
        failed := true;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Allowed non-existent program_id bypass.'; END IF;

    -- Duplicate Checks (Expected: Unique Violation 23505)
    -- University only duplicate
    failed := false;
    INSERT INTO student_shortlists (student_id, university_id) VALUES (v_student_profile, v_uni_1);
    BEGIN
        INSERT INTO student_shortlists (student_id, university_id) VALUES (v_student_profile, v_uni_1);
        failed := true;
    EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Allowed duplicate university-only shortlist.'; END IF;

    -- Program only duplicate
    failed := false;
    INSERT INTO student_shortlists (student_id, program_id) VALUES (v_student_profile, v_prog_2);
    BEGIN
        INSERT INTO student_shortlists (student_id, program_id) VALUES (v_student_profile, v_prog_2);
        failed := true;
    EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Allowed duplicate program-only shortlist.'; END IF;

    -- Combo duplicate
    failed := false;
    INSERT INTO student_shortlists (student_id, program_id, university_id) VALUES (v_student_profile, v_prog_1, v_uni_1);
    BEGIN
        INSERT INTO student_shortlists (student_id, program_id, university_id) VALUES (v_student_profile, v_prog_1, v_uni_1);
        failed := true;
    EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
    IF failed THEN RAISE EXCEPTION 'FAIL: Allowed duplicate combination shortlist.'; END IF;
END $$;

-- ============================================================================
-- 20. FINAL PASS / AUTOMATIC ROLLBACK
-- ============================================================================
SET LOCAL ROLE postgres;
DO $$
BEGIN
    RAISE NOTICE '======================================================================';
    RAISE NOTICE 'ALL SECURITY TESTS PASSED';
    RAISE NOTICE '======================================================================';
END $$;

ROLLBACK;
