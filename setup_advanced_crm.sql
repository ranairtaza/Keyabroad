-- Run this script in the Supabase SQL Editor to upgrade your CRM

-- 1. Add new columns to the students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS pipeline_type TEXT DEFAULT 'Admissions',
ADD COLUMN IF NOT EXISTS admissions_stage TEXT DEFAULT 'New',
ADD COLUMN IF NOT EXISTS language_stage TEXT DEFAULT 'Enrolled',
ADD COLUMN IF NOT EXISTS university_applied TEXT,
ADD COLUMN IF NOT EXISTS target_score TEXT;

-- 2. Create the fee_logs table
CREATE TABLE IF NOT EXISTS fee_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount_paid NUMERIC NOT NULL,
    months_covered INTEGER DEFAULT 1,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_due_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on fee_logs
ALTER TABLE fee_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage fee logs
CREATE POLICY "Allow authenticated users to read fee logs"
ON fee_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert fee logs"
ON fee_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update fee logs"
ON fee_logs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete fee logs"
ON fee_logs FOR DELETE TO authenticated USING (true);
