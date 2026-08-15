-- ============================================================================
-- PHASE 16.1.1: SECURE NOTIFICATIONS
-- Fixes overly permissive Realtime RLS on the notifications table
-- ============================================================================

-- 1. Add user_id to notifications for secure cryptographic linking
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Drop the old insecure policy
DROP POLICY IF EXISTS "Enable all for public on notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_all_authenticated" ON notifications;
DROP POLICY IF EXISTS "Staff full access notifications" ON notifications;

-- 3. Create secure isolated policies
-- A. Students can only see their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
  );

-- B. Staff can insert notifications for anyone
CREATE POLICY "notifications_insert_staff"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
  );

-- C. Staff can update/delete notifications
CREATE POLICY "notifications_update_staff"
  ON notifications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
  );

-- D. Users can mark their own notifications as read
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Re-enable Realtime explicitly to ensure it inherits these policies
-- (Already added to publication, but ensuring it's secure)
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. Add index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
