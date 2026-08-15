-- ============================================================================
-- PHASE 16.6: DOMAIN-STATE NOTIFICATION TRIGGERS
-- Generates automated notifications on domain state changes
-- ============================================================================

-- Create a generic function to insert notifications
CREATE OR REPLACE FUNCTION notify_domain_event()
RETURNS TRIGGER AS $$
BEGIN
  -- We'll assume the notification should go to the student and any assigned counselor
  -- This function is specific to the student_applications table right now
  IF TG_TABLE_NAME = 'student_applications' THEN
    -- If the status changed
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      -- Notify Student
      INSERT INTO notifications (user_id, recipient, message)
      SELECT 
        s.user_id, 
        s.user_id::text, 
        'Your application for ' || NEW.program_name || ' is now: ' || NEW.status
      FROM students s WHERE s.id = NEW.student_id;

      -- Notify Counselor (if assigned)
      IF NEW.managed_by IS NOT NULL THEN
        INSERT INTO notifications (user_id, recipient, message)
        VALUES (
          NEW.managed_by, 
          'Counselor', 
          'Application status changed for ' || NEW.program_name || ' to ' || NEW.status
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on student_applications status changes
DROP TRIGGER IF EXISTS trg_app_status_notification ON student_applications;
CREATE TRIGGER trg_app_status_notification
  AFTER UPDATE OF status ON student_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_domain_event();
