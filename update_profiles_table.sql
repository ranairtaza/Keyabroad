-- Run this in your Supabase SQL Editor to ensure the profiles table has all necessary custom columns

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    designation TEXT,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add columns if it already existed but was missing them
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- 3. FIX SECURITY POLICIES (This is likely what blocked your update!)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable select for all" ON profiles;
CREATE POLICY "Enable select for all" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON profiles;
CREATE POLICY "Enable update for authenticated users" ON profiles FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
CREATE POLICY "Enable insert for authenticated users" ON profiles FOR INSERT WITH CHECK (true);
