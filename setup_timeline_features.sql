-- 1. Create Activity Logs Table for Timeline and Dashboard Feed
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- e.g., 'COMMENT', 'STATUS_CHANGE', 'NEW_STUDENT'
    description TEXT NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL, -- "Contacted By"
    followup_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and public access for Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for public on activity_logs" ON activity_logs;
CREATE POLICY "Enable all for public on activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

-- 2. Update Students table to ensure we have Sub-Agent fields if needed
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS referred_by_subagent TEXT,
ADD COLUMN IF NOT EXISTS subagent_name TEXT;

-- (Optional) If you are using enums or check constraints for status, you would update them here.
-- Since the tables currently use TEXT fields for status/stage, 'On Hold' and 'Closed' 
-- can just be inserted directly by the UI.
