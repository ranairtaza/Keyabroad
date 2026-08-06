-- Run this in your Supabase SQL Editor to set up the tables for the CRM Features!

-- 1. Create Universities Table (For Course Matcher)
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    tuition_fee NUMERIC,
    min_ielts NUMERIC,
    min_pte NUMERIC,
    subjects_offered TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and public access for Universities
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for public on universities" ON universities;
CREATE POLICY "Enable all for public on universities" ON universities FOR ALL USING (true) WITH CHECK (true);

-- Insert some dummy data for the Course Matcher
INSERT INTO universities (name, country, tuition_fee, min_ielts, min_pte, subjects_offered) 
VALUES 
('Aston University', 'UK', 18000, 6.0, 55, ARRAY['Business', 'Engineering', 'IT']),
('University of Leeds', 'UK', 22000, 6.5, 60, ARRAY['Business', 'Law', 'Arts']),
('Deakin University', 'Australia', 35000, 6.0, 50, ARRAY['IT', 'Nursing', 'Business']),
('University of Toronto', 'Canada', 45000, 7.0, 65, ARRAY['Engineering', 'Medicine', 'IT']),
('Berlin Institute of Technology', 'Germany', 0, 6.5, 60, ARRAY['Engineering', 'IT', 'Science'])
ON CONFLICT DO NOTHING;


-- 2. Create Follow-ups Table (For Task Reminders)
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    counselor_name TEXT,
    follow_up_date DATE NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and public access for Follow-ups
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for public on follow_ups" ON follow_ups;
CREATE POLICY "Enable all for public on follow_ups" ON follow_ups FOR ALL USING (true) WITH CHECK (true);


-- 3. Create Appointments Table (For Integrated Booking)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    counselor_assigned TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and public access for Appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for public on appointments" ON appointments;
CREATE POLICY "Enable all for public on appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);
