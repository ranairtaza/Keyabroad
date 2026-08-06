-- Run this in your Supabase SQL Editor! 
-- This safely adds the missing Task Tracking columns to the enquiries table in case the table was already created earlier.

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assignee TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS completed_by TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS ticket_number TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Just in case the RLS policies were never applied:
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for public" ON enquiries;
CREATE POLICY "Enable insert for public" ON enquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for public" ON enquiries;
CREATE POLICY "Enable select for public" ON enquiries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated users" ON enquiries;
CREATE POLICY "Enable all for authenticated users" ON enquiries FOR ALL USING (true) WITH CHECK (true);
