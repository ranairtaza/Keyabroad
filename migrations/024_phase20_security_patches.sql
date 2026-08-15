-- 024_phase20_security_patches.sql
-- Applies critical Database security fixes identified in Phase 1-20 Production Audit

-- 1. Patch `record_payment` Security Definer Escalation Vector
-- Appending SET search_path = public to lock the execution environment
CREATE OR REPLACE FUNCTION record_payment(
    p_invoice_id UUID,
    p_amount NUMERIC(12, 2),
    p_method payment_method,
    p_reference_number TEXT,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_invoice RECORD;
    v_payment_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Lock the invoice row to prevent concurrent double-payments
    SELECT * INTO v_invoice 
    FROM public.invoices 
    WHERE id = p_invoice_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    IF v_invoice.status IN ('PAID', 'CANCELLED') THEN
        RAISE EXCEPTION 'Cannot apply payment to a % invoice', v_invoice.status;
    END IF;

    -- Validate currency (implicit, we use invoice currency)
    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero';
    END IF;
    
    IF p_amount > (v_invoice.total_amount - v_invoice.amount_paid) THEN
        RAISE EXCEPTION 'Payment amount % exceeds outstanding balance %', p_amount, (v_invoice.total_amount - v_invoice.amount_paid);
    END IF;

    -- Insert payment
    INSERT INTO public.payments (
        invoice_id, amount, currency_code, method, reference_number, notes, received_by
    ) VALUES (
        p_invoice_id, p_amount, v_invoice.currency_code, p_method, p_reference_number, p_notes, v_user_id
    ) RETURNING id INTO v_payment_id;

    -- Update invoice to trigger `enforce_amount_paid_immutability` recalculation
    UPDATE public.invoices SET updated_at = now() WHERE id = p_invoice_id;

    -- Audit Log
    INSERT INTO public.audit_logs (entity_name, entity_type, entity_id, actor_id, action, new_data)
    VALUES (
        'payment', 'payment', v_payment_id, v_user_id, 'PAYMENT_CONFIRMED',
        jsonb_build_object(
            'invoice_id', p_invoice_id,
            'amount', p_amount,
            'currency', v_invoice.currency_code,
            'payment_method', p_method,
            'reference_number', p_reference_number
        )
    );

    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Tighten CRM Leads RLS (Remove Global Leakage for Branch Managers)
DROP POLICY IF EXISTS "Admins can view all leads" ON public.crm_leads;

-- Super Admins and Admins retain global access
CREATE POLICY "Admins can view all leads" ON public.crm_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.staff_role IN ('super_admin', 'admin')
        )
    );

-- Branch Managers only see unassigned leads OR leads assigned to their branch's counselors
DROP POLICY IF EXISTS "Branch Managers view branch leads" ON public.crm_leads;
CREATE POLICY "Branch Managers view branch leads" ON public.crm_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles me
            WHERE me.id = auth.uid() 
            AND me.staff_role = 'branch_manager'
            AND (
                crm_leads.assigned_counselor_id IS NULL 
                OR EXISTS (
                    SELECT 1 FROM public.profiles counselor 
                    WHERE counselor.id = crm_leads.assigned_counselor_id 
                    AND counselor.branch = me.branch
                )
            )
        )
    );
