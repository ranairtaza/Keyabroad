-- =================================================================================
-- PHASE 6C: ATOMIC LEAVE APPROVAL & SECURITY ENFORCEMENT
-- =================================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.review_leave_request(
    request_id UUID,
    new_status TEXT,
    comment TEXT,
    reviewer UUID
) RETURNS void AS $$
DECLARE
    req RECORD;
    current_year INTEGER;
    balance_record RECORD;
BEGIN
    -- Only allow APPROVED or REJECTED
    IF new_status NOT IN ('APPROVED', 'REJECTED') THEN
        RAISE EXCEPTION 'Invalid status';
    END IF;

    -- Lock the request row
    SELECT * INTO req FROM public.leave_requests WHERE id = request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Leave request not found';
    END IF;

    IF req.status != 'PENDING' THEN
        RAISE EXCEPTION 'Leave request is not pending';
    END IF;

    -- If approved, atomically increment total_used
    IF new_status = 'APPROVED' THEN
        current_year := extract(year from req.start_date);
        
        -- Lock the balance row
        SELECT * INTO balance_record FROM public.leave_balances 
        WHERE employee_id = req.employee_id 
          AND leave_type_id = req.leave_type_id 
          AND year = current_year 
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Leave balance not found for this employee and type';
        END IF;

        IF (balance_record.total_accrued - balance_record.total_used) < req.total_days THEN
            RAISE EXCEPTION 'Insufficient leave balance';
        END IF;

        UPDATE public.leave_balances
        SET total_used = total_used + req.total_days
        WHERE id = balance_record.id;
    END IF;

    -- Update request
    UPDATE public.leave_requests
    SET status = new_status,
        reviewer_comment = comment,
        reviewed_at = NOW(),
        reviewed_by = reviewer
    WHERE id = request_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke default
REVOKE EXECUTE ON FUNCTION public.review_leave_request(UUID, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_leave_request(UUID, TEXT, TEXT, UUID) TO service_role;

COMMIT;
