-- Run this in your Supabase SQL Editor to create the notifications table and enable real-time!

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Realtime for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read, insert, update notifications
-- (In a production app, you'd restrict this to just the recipient, but this is fine for internal admin tools)
DROP POLICY IF EXISTS "Enable all for public on notifications" ON notifications;
CREATE POLICY "Enable all for public on notifications" ON notifications FOR ALL USING (true);
