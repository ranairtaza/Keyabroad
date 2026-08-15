-- ============================================================================
-- PHASE 19: REPORTING & BUSINESS INTELLIGENCE
-- Migration: 021_phase19_analytics.sql
-- ============================================================================

-- ============================================================================
-- 1. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON public.crm_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_student_apps_status_date ON public.student_applications(status, created_at);
CREATE INDEX IF NOT EXISTS idx_student_docs_status_date ON public.student_documents(verification_status, created_at);

-- ============================================================================
-- 2. ANALYTICS: LEAD FUNNEL (SECURITY DEFINER RPC)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_analytics_leads(p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_role TEXT;
    v_branch TEXT;
    v_result JSONB;
BEGIN
    -- Determine role
    SELECT staff_role, branch INTO v_role, v_branch FROM public.profiles WHERE id = auth.uid();
    
    IF v_role IS NULL THEN
        RETURN '[]'::JSON; -- Unauthorized
    END IF;

    WITH filtered_leads AS (
        SELECT * FROM public.crm_leads
        WHERE (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
          AND (
              v_role IN ('super_admin', 'admin') 
              OR (v_role = 'branch_manager' AND assigned_counselor_id IN (SELECT id FROM profiles WHERE branch = v_branch))
              OR (assigned_counselor_id = auth.uid())
          )
    )
    SELECT json_build_object(
        'total_leads', COUNT(*),
        'by_source', COALESCE((SELECT jsonb_object_agg(source_name, source_count) FROM (SELECT COALESCE(lead_source, 'Organic') AS source_name, COUNT(*) AS source_count FROM filtered_leads GROUP BY COALESCE(lead_source, 'Organic')) s), '{}'::JSONB),
        'by_status', COALESCE((SELECT jsonb_object_agg(status_name, status_count) FROM (SELECT COALESCE(pipeline_status, 'New') AS status_name, COUNT(*) AS status_count FROM filtered_leads GROUP BY COALESCE(pipeline_status, 'New')) s), '{}'::JSONB),
        'converted_to_student', COUNT(*) FILTER (WHERE pipeline_status IN ('Student', 'Enrolled'))
    ) INTO v_result FROM filtered_leads;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. ANALYTICS: APPLICATIONS & VISAS (SECURITY DEFINER RPC)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_analytics_applications(p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_role TEXT;
    v_branch TEXT;
    v_result JSONB;
BEGIN
    SELECT staff_role, branch INTO v_role, v_branch FROM public.profiles WHERE id = auth.uid();
    IF v_role IS NULL THEN RETURN '[]'::JSON; END IF;

    WITH filtered_apps AS (
        SELECT a.*, s.assigned_counselor_id, u.name AS university_name, c.name AS country_name
        FROM public.student_applications a
        JOIN public.students s ON a.student_id = s.id
        LEFT JOIN public.universities u ON a.university_id = u.id
        LEFT JOIN public.countries c ON u.country_id = c.id
        WHERE (p_start_date IS NULL OR a.created_at >= p_start_date)
          AND (p_end_date IS NULL OR a.created_at <= p_end_date)
          AND (
              v_role IN ('super_admin', 'admin') 
              OR (v_role = 'branch_manager' AND s.assigned_counselor_id IN (SELECT id FROM profiles WHERE branch = v_branch))
              OR (s.assigned_counselor_id = auth.uid())
          )
    )
    SELECT json_build_object(
        'total_applications', COUNT(*),
        'by_status', COALESCE((SELECT jsonb_object_agg(status_name, status_count) FROM (SELECT status AS status_name, COUNT(*) AS status_count FROM filtered_apps GROUP BY status) s), '{}'::JSONB),
        'by_country', COALESCE((SELECT jsonb_object_agg(COALESCE(country_name, 'Unknown'), country_count) FROM (SELECT COALESCE(country_name, 'Unknown') AS country_name, COUNT(*) AS country_count FROM filtered_apps GROUP BY COALESCE(country_name, 'Unknown')) s), '{}'::JSONB),
        'by_university', COALESCE((SELECT jsonb_object_agg(COALESCE(university_name, 'Unknown'), uni_count) FROM (SELECT COALESCE(university_name, 'Unknown') AS university_name, COUNT(*) AS uni_count FROM filtered_apps GROUP BY COALESCE(university_name, 'Unknown') ORDER BY uni_count DESC LIMIT 10) s), '{}'::JSONB),
        'visa_approvals', COUNT(*) FILTER (WHERE status = 'visa_approved'),
        'visa_rejections', COUNT(*) FILTER (WHERE status = 'visa_rejected')
    ) INTO v_result FROM filtered_apps;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. ANALYTICS: COUNSELOR PERFORMANCE (SECURITY DEFINER RPC)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_analytics_counselors(p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_role TEXT;
    v_branch TEXT;
    v_result JSONB;
BEGIN
    SELECT staff_role, branch INTO v_role, v_branch FROM public.profiles WHERE id = auth.uid();
    IF v_role IS NULL THEN RETURN '[]'::JSON; END IF;

    -- Only Admins/Branch Managers can view team performance
    IF v_role NOT IN ('super_admin', 'admin', 'branch_manager') THEN
        -- Counselors can only see themselves
        WITH counselor_stats AS (
            SELECT 
                p.id, 
                p.full_name,
                (SELECT COUNT(*) FROM public.crm_leads l WHERE l.assigned_counselor_id = p.id AND (p_start_date IS NULL OR l.created_at >= p_start_date) AND (p_end_date IS NULL OR l.created_at <= p_end_date)) as total_leads,
                (SELECT COUNT(*) FROM public.students s WHERE s.assigned_counselor_id = p.id AND (p_start_date IS NULL OR s.created_at >= p_start_date) AND (p_end_date IS NULL OR s.created_at <= p_end_date)) as total_students,
                (SELECT COUNT(*) FROM public.crm_tasks t WHERE t.assigned_to = p.id AND t.status = 'completed' AND (p_start_date IS NULL OR t.created_at >= p_start_date) AND (p_end_date IS NULL OR t.created_at <= p_end_date)) as tasks_completed,
                (SELECT COUNT(*) FROM public.crm_tasks t WHERE t.assigned_to = p.id AND t.status != 'completed' AND t.due_date < now()) as tasks_overdue
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
        SELECT COALESCE(json_agg(row_to_json(counselor_stats)), '[]'::JSON) INTO v_result FROM counselor_stats;
        RETURN v_result;
    END IF;

    WITH counselor_stats AS (
        SELECT 
            p.id, 
            p.full_name,
            p.branch,
            (SELECT COUNT(*) FROM public.crm_leads l WHERE l.assigned_counselor_id = p.id AND (p_start_date IS NULL OR l.created_at >= p_start_date) AND (p_end_date IS NULL OR l.created_at <= p_end_date)) as total_leads,
            (SELECT COUNT(*) FROM public.students s WHERE s.assigned_counselor_id = p.id AND (p_start_date IS NULL OR s.created_at >= p_start_date) AND (p_end_date IS NULL OR s.created_at <= p_end_date)) as total_students,
            (SELECT COUNT(*) FROM public.crm_tasks t WHERE t.assigned_to = p.id AND t.status = 'completed' AND (p_start_date IS NULL OR t.created_at >= p_start_date) AND (p_end_date IS NULL OR t.created_at <= p_end_date)) as tasks_completed,
            (SELECT COUNT(*) FROM public.crm_tasks t WHERE t.assigned_to = p.id AND t.status != 'completed' AND t.due_date < now()) as tasks_overdue
        FROM public.profiles p
        WHERE p.staff_role = 'counselor'
          AND (v_role IN ('super_admin', 'admin') OR p.branch = v_branch)
    )
    SELECT COALESCE(json_agg(row_to_json(counselor_stats)), '[]'::JSON) INTO v_result FROM counselor_stats;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
