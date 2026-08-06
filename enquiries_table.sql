-- Run this in your Supabase SQL Editor to create the enquiries table with Task Management tracking

CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Personal Information
    full_name TEXT NOT NULL,
    dob TEXT,
    mobile TEXT NOT NULL,
    email TEXT,
    city TEXT,
    passport_available BOOLEAN DEFAULT false,
    
    -- Language Proficiency
    language_test TEXT,
    reading_score TEXT,
    listening_score TEXT,
    writing_score TEXT,
    speaking_score TEXT,
    
    -- Education (JSON array of education history)
    education_history JSONB DEFAULT '[]'::jsonb,
    
    -- Work Experience
    has_work_experience BOOLEAN DEFAULT false,
    work_duration TEXT,
    job_title TEXT,
    company_name TEXT,
    
    -- Destination & Subjects
    destinations JSONB DEFAULT '[]'::jsonb,
    preferred_subjects JSONB DEFAULT '[]'::jsonb,
    total_budget_pkr TEXT,
    
    -- Immigration History
    applied_for_visa BOOLEAN DEFAULT false,
    visa_country TEXT,
    visa_type TEXT,
    visa_status TEXT, 
    visa_refusal_reason TEXT,
    
    -- Documents Checklist
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Consultant Assessment (Office Use Only)
    eligibility TEXT,
    recommended_countries TEXT,
    recommended_universities TEXT,
    academic_profile TEXT,
    visa_chances TEXT,
    scholarship_chances TEXT,
    
    -- Queue & Task Management
    ticket_number TEXT,
    status TEXT DEFAULT 'pending', -- 'pending' or 'done'
    assignee TEXT,                 -- Employee looking after this walk-in
    completed_by TEXT,             -- Who finally marked it done
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Allow public inserts from the walk-in tablet app
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for public" ON enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for public" ON enquiries FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users" ON enquiries FOR ALL USING (true) WITH CHECK (true);
