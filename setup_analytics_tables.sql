-- Run this in your Supabase SQL Editor to initialize the Analytics tables!

-- 1. Create table for tracking website visits
CREATE TABLE IF NOT EXISTS website_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_url TEXT,
    referrer TEXT,
    device_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Security Policies for visits
ALTER TABLE website_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for public" ON website_visits;
CREATE POLICY "Enable insert for public" ON website_visits FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable select for public" ON website_visits;
CREATE POLICY "Enable select for public" ON website_visits FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all for authenticated users" ON website_visits;
CREATE POLICY "Enable all for authenticated users" ON website_visits FOR ALL USING (true);

-- 2. Create table for tracking new leads/applications from the website
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    destination TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Security Policies for applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for public" ON applications;
CREATE POLICY "Enable insert for public" ON applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable select for public" ON applications;
CREATE POLICY "Enable select for public" ON applications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all for authenticated users" ON applications;
CREATE POLICY "Enable all for authenticated users" ON applications FOR ALL USING (true);
