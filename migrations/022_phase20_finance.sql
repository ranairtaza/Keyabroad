-- ============================================================================
-- KEYABROAD 2.0 - PHASE 20
-- FINANCIAL & REVENUE INTELLIGENCE (MIGRATION 022)
-- ============================================================================

-- ============================================================================
-- 1. ENUMS & SEQUENCES
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('BANK_TRANSFER', 'CASH', 'CREDIT_CARD', 'CHEQUE', 'ONLINE_GATEWAY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('CONFIRMED', 'REVERSED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE commission_status AS ENUM ('EXPECTED', 'PARTIAL', 'RECEIVED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- ============================================================================
-- 2. DOMAIN TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    branch TEXT, -- Snapshot of branch ownership at creation
    assigned_counselor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Snapshot of counselor ownership
    invoice_number TEXT UNIQUE,
    status invoice_status NOT NULL DEFAULT 'DRAFT',
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    issued_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safely add columns if the table already existed from a partial run
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS assigned_counselor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status invoice_status NOT NULL DEFAULT 'DRAFT';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS currency_code CHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_amount >= 0),
    total_amount NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_amount) STORED,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    reversal_of_payment_id UUID REFERENCES public.payments(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    method payment_method NOT NULL DEFAULT 'BANK_TRANSFER',
    reference_number TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status payment_status NOT NULL DEFAULT 'CONFIRMED',
    received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reversal_of_payment_id UUID REFERENCES public.payments(id) ON DELETE RESTRICT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) NOT NULL DEFAULT 1.00;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency_code CHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS method payment_method NOT NULL DEFAULT 'BANK_TRANSFER';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status payment_status NOT NULL DEFAULT 'CONFIRMED';


CREATE TABLE IF NOT EXISTS public.university_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.student_applications(id) ON DELETE CASCADE UNIQUE,
    expected_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (expected_amount >= 0),
    received_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (received_amount >= 0),
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    status commission_status NOT NULL DEFAULT 'EXPECTED',
    expected_date DATE,
    received_date DATE,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_commission_received CHECK (received_amount <= expected_amount)
);

ALTER TABLE public.university_commissions ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.student_applications(id) ON DELETE CASCADE;
ALTER TABLE public.university_commissions ADD COLUMN IF NOT EXISTS expected_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.university_commissions ADD COLUMN IF NOT EXISTS received_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.university_commissions ADD COLUMN IF NOT EXISTS currency_code CHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE public.university_commissions ADD COLUMN IF NOT EXISTS status commission_status NOT NULL DEFAULT 'EXPECTED';
ALTER TABLE public.university_commissions ADD COLUMN IF NOT EXISTS received_date DATE;
ALTER TABLE public.university_commissions ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_invoices_student ON public.invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON public.invoices(status, due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_commissions_application ON public.university_commissions(application_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.university_commissions(status);

-- ============================================================================
-- 4. SERVER-SIDE TRIGGERS & CALCULATION LOGIC
-- ============================================================================

-- Trigger to auto-generate INV number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_invoice_number ON public.invoices;
CREATE TRIGGER trg_set_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION set_invoice_number();


-- Trigger to calculate invoice items total
CREATE OR REPLACE FUNCTION update_invoice_total_from_items()
RETURNS TRIGGER AS $$
DECLARE
    v_total NUMERIC(12, 2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total
    FROM public.invoice_items
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    UPDATE public.invoices
    SET total_amount = v_total
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_invoice_total ON public.invoice_items;
CREATE TRIGGER trg_update_invoice_total
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION update_invoice_total_from_items();


-- Trigger to safely protect amount_paid and recalculate it only on demand
CREATE OR REPLACE FUNCTION enforce_amount_paid_immutability()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid NUMERIC(12, 2);
    v_invoice_amount NUMERIC(12, 2);
BEGIN
    -- Only sum CONFIRMED payments (subtracting REVERSED is handled if reversed payments are recorded as negative? 
    -- Or if REVERSED payments are ignored. We ignore REVERSED payments).
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.payments
    WHERE invoice_id = NEW.id
      AND status = 'CONFIRMED';

    -- Force the amount_paid to be exactly the sum of confirmed payments, overriding any client edits
    NEW.amount_paid := v_total_paid;
    
    -- Auto-adjust status if enough is paid
    IF NEW.amount_paid >= NEW.total_amount AND NEW.total_amount > 0 THEN
        NEW.status := 'PAID';
    ELSIF NEW.amount_paid > 0 AND NEW.status = 'ISSUED' THEN
        NEW.status := 'PARTIAL';
    END IF;
    
    -- Block modifications to core fields if ISSUED or PAID
    IF OLD.status IN ('ISSUED', 'PARTIAL', 'PAID', 'OVERDUE') THEN
        IF NEW.student_id != OLD.student_id OR 
           NEW.currency_code != OLD.currency_code OR 
           NEW.branch != OLD.branch OR 
           NEW.assigned_counselor_id != OLD.assigned_counselor_id THEN
            RAISE EXCEPTION 'Cannot modify ownership or currency of an issued invoice';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_amount_paid ON public.invoices;
CREATE TRIGGER trg_enforce_amount_paid
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION enforce_amount_paid_immutability();


-- Trigger to protect invoice_items from modification if invoice is ISSUED
CREATE OR REPLACE FUNCTION protect_invoice_items()
RETURNS TRIGGER AS $$
DECLARE
    v_status invoice_status;
BEGIN
    SELECT status INTO v_status FROM public.invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    IF v_status IN ('ISSUED', 'PARTIAL', 'PAID', 'OVERDUE') THEN
        RAISE EXCEPTION 'Cannot modify line items of an issued invoice';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_invoice_items ON public.invoice_items;
CREATE TRIGGER trg_protect_invoice_items
BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION protect_invoice_items();


-- Trigger to protect immutable payments
CREATE OR REPLACE FUNCTION protect_immutable_payments()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' AND OLD.status = 'CONFIRMED' THEN
        RAISE EXCEPTION 'Confirmed payments cannot be deleted. Use REVERSAL status instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_immutable_payments ON public.payments;
CREATE TRIGGER trg_protect_immutable_payments
BEFORE DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION protect_immutable_payments();


-- ============================================================================
-- 5. PAYMENT RPC (SECURITY DEFINER WITH FOR UPDATE)
-- ============================================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 6. RLS AND SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_commissions ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins full access invoices" ON public.invoices FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin'))
);
CREATE POLICY "Admins full access invoice_items" ON public.invoice_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin'))
);
CREATE POLICY "Admins full access payments" ON public.payments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin'))
);
CREATE POLICY "Admins full access commissions" ON public.university_commissions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND staff_role IN ('super_admin', 'admin'))
);

-- Branch Managers access
CREATE POLICY "Branch Managers view invoices" ON public.invoices FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles me
        WHERE me.id = auth.uid() AND me.staff_role = 'branch_manager' AND me.branch = invoices.branch
    )
);
CREATE POLICY "Branch Managers view payments" ON public.payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.invoices i
        JOIN public.profiles me ON me.branch = i.branch
        WHERE i.id = payments.invoice_id AND me.id = auth.uid() AND me.staff_role = 'branch_manager'
    )
);

-- Counselors access (READ)
CREATE POLICY "Counselors view assigned student invoices" ON public.invoices FOR SELECT USING (
    invoices.assigned_counselor_id = auth.uid()
);
CREATE POLICY "Counselors view payments" ON public.payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.id = payments.invoice_id AND i.assigned_counselor_id = auth.uid()
    )
);
-- Counselors write (CREATE DRAFT)
CREATE POLICY "Counselors insert draft invoices" ON public.invoices FOR INSERT WITH CHECK (
    auth.uid() = assigned_counselor_id AND status = 'DRAFT'
);

-- Students access
CREATE POLICY "Students can view their own invoices" ON public.invoices FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = invoices.student_id AND s.user_id = auth.uid())
);
CREATE POLICY "Students can view their own invoice items" ON public.invoice_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.invoices i
        JOIN public.students s ON i.student_id = s.id
        WHERE i.id = invoice_items.invoice_id AND s.user_id = auth.uid()
    )
);
CREATE POLICY "Students view their payments" ON public.payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.invoices i
        JOIN public.students s ON i.student_id = s.id
        WHERE i.id = payments.invoice_id AND s.user_id = auth.uid()
    )
);
