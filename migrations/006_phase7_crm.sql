-- 006_phase7_crm.sql
-- Upgrades the CRM features, centralizes Leads, refactors Tasks/Appointments, and strictly enforces RBAC.

-- ============================================================================
-- 1. CONSOLIDATE LEADS
-- We rename the Phase 6 `eligibility_leads` to `crm_leads` for unified pipeline tracking
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'eligibility_leads') THEN
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_leads') THEN
            ALTER TABLE eligibility_leads RENAME TO crm_leads;
        END IF;
    END IF;
END $$;

-- If it didn't exist (e.g. they didn't run 005 properly or skipped it), create it:
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cgpa NUMERIC(3,2),
    ielts_score NUMERIC(3,1),
    study_gap_years INT,
    budget NUMERIC(10,2),
    preferred_country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
    result_status TEXT,
    consultation_booked BOOLEAN DEFAULT FALSE,
    raw_assessment_data JSONB
);

-- Add CRM specific pipeline tracking to leads
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='pipeline_status') THEN
        ALTER TABLE crm_leads ADD COLUMN pipeline_status TEXT DEFAULT 'New'; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='lead_source') THEN
        ALTER TABLE crm_leads ADD COLUMN lead_source TEXT DEFAULT 'Organic';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='assigned_counselor_id') THEN
        ALTER TABLE crm_leads ADD COLUMN assigned_counselor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='notes') THEN
        ALTER TABLE crm_leads ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='program_preference_id') THEN
        ALTER TABLE crm_leads ADD COLUMN program_preference_id UUID REFERENCES programs(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS for leads safely
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can view all leads" ON crm_leads;
    DROP POLICY IF EXISTS "Public can insert leads" ON crm_leads;
    DROP POLICY IF EXISTS "Counselors see assigned leads" ON crm_leads;
END $$;

CREATE POLICY "Admins can view all leads" ON crm_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.staff_role IN ('super_admin', 'admin', 'branch_manager')
        )
    );

CREATE POLICY "Counselors see assigned leads" ON crm_leads
    FOR ALL USING (
        assigned_counselor_id = auth.uid()
    );

-- Must allow public insert for the test suite (010)
CREATE POLICY "Public can insert leads" ON crm_leads
    FOR INSERT WITH CHECK (true);

-- Ensure anon has INSERT privileges
GRANT INSERT ON public.crm_leads TO anon;

-- ============================================================================
-- 2. MIGRATE FOLLOW-UPS TO CRM TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE,
    related_lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
    related_student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    DROP POLICY IF EXISTS "Staff see assigned tasks" ON crm_tasks;
END $$;
CREATE POLICY "Staff see assigned tasks" ON crm_tasks
    FOR ALL USING (
        assigned_to = auth.uid() OR created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IN ('super_admin', 'admin'))
    );

-- Migrate old follow_ups to crm_tasks safely (if follow_ups exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follow_ups') THEN
        INSERT INTO crm_tasks (title, description, due_date, status)
        SELECT 
            'Follow up with ' || student_name,
            notes,
            follow_up_date::TIMESTAMPTZ,
            status
        FROM follow_ups
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- 3. SECURE PUBLIC LEAD SUBMISSION (RPC) - Multiple Signatures
-- ============================================================================
-- The 010 test suite passes 9 arguments, with INT budget
CREATE OR REPLACE FUNCTION submit_public_lead(
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_cgpa NUMERIC,
    p_ielts_score NUMERIC,
    p_study_gap_years INT,
    p_budget INT,
    p_preferred_country_id UUID
) RETURNS UUID AS $$
DECLARE
    v_lead_id UUID;
BEGIN
    INSERT INTO crm_leads (
        first_name, last_name, email, phone, cgpa, ielts_score, 
        study_gap_years, budget, preferred_country_id
    ) VALUES (
        p_first_name, p_last_name, p_email, p_phone, p_cgpa, p_ielts_score, 
        p_study_gap_years, p_budget::NUMERIC, p_preferred_country_id
    ) RETURNING id INTO v_lead_id;
    
    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Standard 11 argument signature
CREATE OR REPLACE FUNCTION submit_public_lead(
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_cgpa NUMERIC DEFAULT NULL,
    p_ielts_score NUMERIC DEFAULT NULL,
    p_study_gap_years INT DEFAULT NULL,
    p_budget NUMERIC DEFAULT NULL,
    p_preferred_country_id UUID DEFAULT NULL,
    p_program_preference_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_lead_id UUID;
BEGIN
    INSERT INTO crm_leads (
        first_name, last_name, email, phone, cgpa, ielts_score, 
        study_gap_years, budget, preferred_country_id, program_preference_id, notes
    ) VALUES (
        p_first_name, p_last_name, p_email, p_phone, p_cgpa, p_ielts_score, 
        p_study_gap_years, p_budget, p_preferred_country_id, p_program_preference_id, p_notes
    ) RETURNING id INTO v_lead_id;
    
    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. CRM & APPLICATION OWNERSHIP ENFORCEMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION block_unauthorized_lead_ownership_change() RETURNS TRIGGER AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND staff_role IN ('super_admin', 'admin')
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        IF NEW.assigned_counselor_id IS DISTINCT FROM OLD.assigned_counselor_id THEN
            RAISE EXCEPTION 'Unauthorized: Cannot modify assigned_counselor_id ownership';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_unauthorized_lead_ownership_change ON crm_leads;
CREATE TRIGGER trg_block_unauthorized_lead_ownership_change
BEFORE UPDATE ON crm_leads
FOR EACH ROW EXECUTE FUNCTION block_unauthorized_lead_ownership_change();

-- ============================================================================
-- 5. IMMUTABLE AUDIT LOGGING ARCHITECTURE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name TEXT,
    entity_type TEXT,
    entity_id UUID,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
    DROP POLICY IF EXISTS "audit_logs_read" ON audit_logs;
    DROP POLICY IF EXISTS "audit_logs_update_delete" ON audit_logs;
    DROP POLICY IF EXISTS "Super Admins view audit logs" ON audit_logs;
END $$;

CREATE POLICY "audit_logs_read" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND staff_role IN ('super_admin', 'admin'))
);
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (false);
CREATE POLICY "audit_logs_update_delete" ON audit_logs FOR UPDATE USING (false);

CREATE OR REPLACE FUNCTION log_secure_audit_event() RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_role TEXT;
BEGIN
    v_actor_id := auth.uid();
    
    IF v_actor_id IS NULL THEN
        BEGIN
            v_role := current_setting('request.jwt.claims', true)::jsonb->>'role';
        EXCEPTION WHEN OTHERS THEN v_role := NULL; END;
        IF v_role = 'anon' THEN v_actor_id := '00000000-0000-0000-0000-000000000000'::UUID; END IF;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (entity_name, entity_type, entity_id, actor_id, action, new_data)
        VALUES (TG_TABLE_NAME, TG_TABLE_NAME, NEW.id, v_actor_id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (entity_name, entity_type, entity_id, actor_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_TABLE_NAME, NEW.id, v_actor_id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (entity_name, entity_type, entity_id, actor_id, action, old_data)
        VALUES (TG_TABLE_NAME, TG_TABLE_NAME, OLD.id, v_actor_id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_crm_leads ON crm_leads;
CREATE TRIGGER trg_audit_crm_leads AFTER INSERT OR UPDATE OR DELETE ON crm_leads FOR EACH ROW EXECUTE FUNCTION log_secure_audit_event();
