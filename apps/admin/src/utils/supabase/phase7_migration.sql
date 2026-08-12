-- PHASE 7 MIGRATION
-- Adding the 'messages' table to support real-time chat functionality

CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_email TEXT NOT NULL,
    receiver_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime is usually already enabled globally or this table was already added.
-- (Removed ALTER PUBLICATION to prevent 'already member' errors)

-- Set up Row Level Security (RLS) policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users on messages" ON messages;
CREATE POLICY "Enable all for authenticated users on messages" ON messages FOR ALL USING (auth.role() = 'authenticated');
