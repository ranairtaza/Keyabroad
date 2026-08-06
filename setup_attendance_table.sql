-- Run this in your Supabase SQL Editor to create the Attendance table!

CREATE TABLE IF NOT EXISTS employee_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Security Policies so the app can talk to the table
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;

-- Allow the website to insert attendance records
DROP POLICY IF EXISTS "Enable insert for public" ON employee_attendance;
CREATE POLICY "Enable insert for public" ON employee_attendance FOR INSERT WITH CHECK (true);

-- Allow the website to read records (to prevent double check-ins)
DROP POLICY IF EXISTS "Enable select for public" ON employee_attendance;
CREATE POLICY "Enable select for public" ON employee_attendance FOR SELECT USING (true);

-- Allow admin panel full access
DROP POLICY IF EXISTS "Enable all for authenticated users" ON employee_attendance;
CREATE POLICY "Enable all for authenticated users" ON employee_attendance FOR ALL USING (true);
