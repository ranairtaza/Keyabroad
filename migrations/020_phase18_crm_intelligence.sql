-- ============================================================================
-- PHASE 18: CRM INTELLIGENCE & TASK MANAGEMENT
-- Migration: 020_phase18_crm_intelligence.sql
-- ============================================================================

-- 1. Deadlines for Priority Engine
ALTER TABLE public.student_applications
  ADD COLUMN IF NOT EXISTS visa_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ;

-- 2. Performance Indexes for Dashboard & SLA
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON public.crm_tasks(due_date) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_student_apps_updated ON public.student_applications(updated_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_updated ON public.crm_leads(updated_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_id, created_at);

-- 3. Priority Engine (Deterministic Calculation)
CREATE OR REPLACE FUNCTION get_student_priority(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    v_score INT := 0;
    v_reasons JSONB := '[]'::JSONB;
    v_priority TEXT := 'LOW';
    v_rec RECORD;
BEGIN
    -- Check if student exists
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id) THEN
        RETURN json_build_object('score', 0, 'priority', 'LOW', 'reasons', '[]');
    END IF;

    -- A. Visa deadline proximity (< 7 days)
    IF EXISTS (
        SELECT 1 FROM public.student_applications 
        WHERE student_id = p_student_id AND visa_deadline IS NOT NULL AND visa_deadline < now() + interval '7 days'
    ) THEN
        v_score := v_score + 50;
        v_reasons := v_reasons || '{"reason": "Visa deadline within 7 days"}'::JSONB;
    END IF;

    -- B. Application deadline proximity (< 7 days)
    IF EXISTS (
        SELECT 1 FROM public.student_applications 
        WHERE student_id = p_student_id AND application_deadline IS NOT NULL AND application_deadline < now() + interval '7 days'
    ) THEN
        v_score := v_score + 40;
        v_reasons := v_reasons || '{"reason": "Application deadline within 7 days"}'::JSONB;
    END IF;

    -- C. Document rejected
    IF EXISTS (
        SELECT 1 FROM public.student_documents 
        WHERE student_id = p_student_id AND verification_status = 'rejected'
    ) THEN
        v_score := v_score + 30;
        v_reasons := v_reasons || '{"reason": "Document rejected and requires action"}'::JSONB;
    END IF;

    -- D. Task overdue
    IF EXISTS (
        SELECT 1 FROM public.crm_tasks 
        WHERE related_student_id = p_student_id AND status != 'completed' AND due_date < now()
    ) THEN
        v_score := v_score + 20;
        v_reasons := v_reasons || '{"reason": "Overdue counselor task"}'::JSONB;
    END IF;

    -- E. Lead inactivity (> 7 days without update)
    IF EXISTS (
        SELECT 1 FROM public.crm_leads 
        WHERE student_id = p_student_id AND updated_at < now() - interval '7 days'
    ) THEN
        v_score := v_score + 15;
        v_reasons := v_reasons || '{"reason": "Lead inactive for over 7 days"}'::JSONB;
    END IF;

    -- F. Pending document
    IF EXISTS (
        SELECT 1 FROM public.student_documents 
        WHERE student_id = p_student_id AND verification_status = 'pending'
    ) THEN
        v_score := v_score + 10;
        v_reasons := v_reasons || '{"reason": "Document pending verification"}'::JSONB;
    END IF;

    -- Determine priority tier
    IF v_score > 60 THEN
        v_priority := 'HIGH';
    ELSIF v_score >= 30 THEN
        v_priority := 'MEDIUM';
    END IF;

    RETURN json_build_object(
        'score', v_score,
        'priority', v_priority,
        'reasons', v_reasons
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Unified Activity Timeline RPC
CREATE OR REPLACE FUNCTION get_student_timeline(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSONB := '[]'::JSONB;
BEGIN
    -- Only Staff or the owning Student can call this
    IF NOT (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND staff_role IS NOT NULL) OR
        EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id AND user_id = auth.uid())
    ) THEN
        RETURN v_result; -- empty/unauthorized
    END IF;

    WITH timeline_events AS (
        -- Tasks
        SELECT 
            'task' AS type,
            created_at AS timestamp,
            created_by AS actor_id,
            title,
            description,
            'crm_tasks' AS entity_type,
            id AS entity_id,
            jsonb_build_object('status', status, 'priority', priority) AS metadata
        FROM public.crm_tasks
        WHERE related_student_id = p_student_id
        
        UNION ALL
        
        -- Documents
        SELECT 
            'document' AS type,
            created_at AS timestamp,
            student_id AS actor_id,
            'Document Uploaded' AS title,
            file_name AS description,
            'student_documents' AS entity_type,
            id AS entity_id,
            jsonb_build_object('status', verification_status, 'category', category) AS metadata
        FROM public.student_documents
        WHERE student_id = p_student_id
        
        UNION ALL
        
        -- Audit Logs (Only where entity_id = student_id, or entity_id maps directly to their applications)
        -- Keep simple for now: student entity logs
        SELECT 
            'audit' AS type,
            created_at AS timestamp,
            actor_id,
            action AS title,
            entity_type AS description,
            'audit_logs' AS entity_type,
            id AS entity_id,
            new_data AS metadata
        FROM public.audit_logs
        WHERE entity_id = p_student_id
    )
    SELECT COALESCE(jsonb_agg(row_to_json(timeline_events)), '[]'::JSONB) 
    INTO v_result
    FROM (
        SELECT * FROM timeline_events ORDER BY timestamp DESC LIMIT 100
    ) timeline_events;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
