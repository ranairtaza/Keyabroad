-- Phase 11 Migration
-- Create website_visits table for analytics

CREATE TABLE IF NOT EXISTS website_visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_url TEXT NOT NULL,
    referrer TEXT DEFAULT 'direct',
    device_type TEXT DEFAULT 'desktop',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE website_visits ENABLE ROW LEVEL SECURITY;

-- Allow insert by anon users (since tracking happens on public website without login)
DROP POLICY IF EXISTS "Allow anonymous insert on website_visits" ON website_visits;
CREATE POLICY "Allow anonymous insert on website_visits" ON website_visits FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow select by authenticated users only (admin dashboard)
DROP POLICY IF EXISTS "Enable select for authenticated users on website_visits" ON website_visits;
CREATE POLICY "Enable select for authenticated users on website_visits" ON website_visits FOR SELECT USING (auth.role() = 'authenticated');
