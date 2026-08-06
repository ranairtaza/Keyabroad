-- Run this in your Supabase SQL Editor to allow form submissions to the registrations table!

-- Enable Row Level Security (just in case it's not enabled)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public) to insert new registrations
DROP POLICY IF EXISTS "Enable insert for public" ON registrations;
CREATE POLICY "Enable insert for public" ON registrations FOR INSERT WITH CHECK (true);

-- Allow anyone to select registrations (useful if you want to display them, or for the admin panel to read them)
DROP POLICY IF EXISTS "Enable select for public" ON registrations;
CREATE POLICY "Enable select for public" ON registrations FOR SELECT USING (true);

-- Allow authenticated users (like your admin panel) to do anything
DROP POLICY IF EXISTS "Enable all for authenticated users" ON registrations;
CREATE POLICY "Enable all for authenticated users" ON registrations FOR ALL USING (true);
