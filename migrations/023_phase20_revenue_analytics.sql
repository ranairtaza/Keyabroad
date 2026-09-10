-- PHASE 20 GATE 5: REVENUE ANALYTICS RPCs

CREATE OR REPLACE FUNCTION get_revenue_analytics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
  currency_code CHAR(3),
  total_invoiced NUMERIC(12,2),
  total_collected NUMERIC(12,2),
  total_outstanding NUMERIC(12,2),
  total_overdue NUMERIC(12,2),
  invoice_count INT,
  paid_invoice_count INT,
  partial_invoice_count INT,
  overdue_invoice_count INT
) AS $$
DECLARE
  v_role TEXT;
  v_branch TEXT;
BEGIN
  -- 1. Identify User
  SELECT staff_role, branch INTO v_role, v_branch
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role = 'student' OR v_role IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH scoped_invoices AS (
    SELECT * FROM public.invoices
    WHERE 
      (v_role IN ('super_admin', 'admin') OR
       (v_role = 'branch_manager' AND branch = v_branch) OR
       (v_role = 'counselor' AND assigned_counselor_id = auth.uid()))
      AND (p_start_date IS NULL OR DATE(created_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(created_at) <= p_end_date)
      AND status NOT IN ('DRAFT', 'CANCELLED')
  ),
  scoped_payments AS (
    SELECT p.* FROM public.payments p
    JOIN public.invoices i ON p.invoice_id = i.id
    WHERE 
      (v_role IN ('super_admin', 'admin') OR
       (v_role = 'branch_manager' AND i.branch = v_branch) OR
       (v_role = 'counselor' AND i.assigned_counselor_id = auth.uid()))
      AND (p_start_date IS NULL OR DATE(p.payment_date) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(p.payment_date) <= p_end_date)
      AND p.status = 'CONFIRMED'
  ),
  inv_agg AS (
    SELECT i.currency_code, 
      SUM(i.total_amount) as total_invoiced,
      SUM(GREATEST(0, i.total_amount - i.amount_paid)) as total_outstanding,
      SUM(CASE WHEN i.status = 'OVERDUE' THEN GREATEST(0, i.total_amount - i.amount_paid) ELSE 0 END) as total_overdue,
      COUNT(i.id) as invoice_count,
      COUNT(CASE WHEN i.status = 'PAID' THEN 1 END) as paid_invoice_count,
      COUNT(CASE WHEN i.status = 'PARTIAL' THEN 1 END) as partial_invoice_count,
      COUNT(CASE WHEN i.status = 'OVERDUE' THEN 1 END) as overdue_invoice_count
    FROM scoped_invoices i
    GROUP BY i.currency_code
  ),
  pay_agg AS (
    SELECT p.currency_code, SUM(p.amount) as collected
    FROM scoped_payments p
    GROUP BY p.currency_code
  )
  SELECT 
    COALESCE(i.currency_code, p.currency_code) as currency_code,
    COALESCE(i.total_invoiced, 0)::NUMERIC(12,2) as total_invoiced,
    COALESCE(p.collected, 0)::NUMERIC(12,2) as total_collected,
    COALESCE(i.total_outstanding, 0)::NUMERIC(12,2) as total_outstanding,
    COALESCE(i.total_overdue, 0)::NUMERIC(12,2) as total_overdue,
    COALESCE(i.invoice_count, 0)::INT as invoice_count,
    COALESCE(i.paid_invoice_count, 0)::INT as paid_invoice_count,
    COALESCE(i.partial_invoice_count, 0)::INT as partial_invoice_count,
    COALESCE(i.overdue_invoice_count, 0)::INT as overdue_invoice_count
  FROM inv_agg i
  FULL OUTER JOIN pay_agg p ON i.currency_code = p.currency_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_commission_kpis(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
  currency_code CHAR(3),
  expected_commissions NUMERIC(12,2),
  received_commissions NUMERIC(12,2),
  expected_count INT,
  received_count INT
) AS $$
DECLARE
  v_role TEXT;
  v_branch TEXT;
BEGIN
  SELECT staff_role, branch INTO v_role, v_branch
  FROM public.profiles WHERE id = auth.uid();

  IF v_role = 'student' OR v_role IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    c.currency_code,
    COALESCE(SUM(c.expected_amount), 0)::NUMERIC(12,2) as expected_commissions,
    COALESCE(SUM(c.received_amount), 0)::NUMERIC(12,2) as received_commissions,
    COUNT(CASE WHEN c.status IN ('EXPECTED', 'PARTIAL') THEN 1 END)::INT as expected_count,
    COUNT(CASE WHEN c.status = 'RECEIVED' THEN 1 END)::INT as received_count
  FROM public.university_commissions c
  JOIN public.student_applications a ON c.application_id = a.id
  JOIN public.profiles p ON a.assigned_counselor_id = p.id
  WHERE 
    (v_role IN ('super_admin', 'admin') OR
     (v_role = 'branch_manager' AND p.branch = v_branch) OR
     (v_role = 'counselor' AND a.assigned_counselor_id = auth.uid()))
    AND (p_start_date IS NULL OR DATE(c.created_at) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(c.created_at) <= p_end_date)
  GROUP BY c.currency_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
