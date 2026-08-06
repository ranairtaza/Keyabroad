-- Run this script in the Supabase SQL Editor to create the Feedbacks table

CREATE TABLE IF NOT EXISTS student_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE student_feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE to insert feedback (since the form is public for the student)
CREATE POLICY "Allow public insert to feedbacks"
ON student_feedbacks FOR INSERT WITH CHECK (true);

-- Allow authenticated users (Admin) to read feedbacks
CREATE POLICY "Allow authenticated users to read feedbacks"
ON student_feedbacks FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to delete/update feedbacks if needed
CREATE POLICY "Allow authenticated users to modify feedbacks"
ON student_feedbacks FOR ALL TO authenticated USING (true);
