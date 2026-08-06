-- Run this script in the Supabase SQL Editor to create the Student Database table

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT,
    phone TEXT,
    email TEXT,
    target_destination TEXT,
    language_test TEXT,
    test_date_time TIMESTAMP WITH TIME ZONE,
    file_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow authenticated users to read students"
ON students FOR SELECT TO authenticated USING (true);

-- Allow insert access for authenticated users
CREATE POLICY "Allow authenticated users to insert students"
ON students FOR INSERT TO authenticated WITH CHECK (true);

-- Allow update access for authenticated users
CREATE POLICY "Allow authenticated users to update students"
ON students FOR UPDATE TO authenticated USING (true);

-- Note: Don't forget to create a new Storage Bucket named "student_files" in your Supabase Dashboard
-- and set it to Public!
