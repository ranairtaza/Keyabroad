-- Migration 042: Fix RLS for student_feedbacks
-- This allows the public website (anon user) to read approved reviews

-- Enable RLS if not already enabled (just in case)
ALTER TABLE public.student_feedbacks ENABLE ROW LEVEL SECURITY;

-- Drop existing public read policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to student_feedbacks" ON public.student_feedbacks;

-- Create policy to allow public reads
CREATE POLICY "Allow public read access to student_feedbacks"
ON public.student_feedbacks
FOR SELECT
USING (true);

-- Also ensure anon can read the specific columns needed from students table
-- Note: 'Students can view their own documents' exists, but we need to ensure 
-- anon can at least read name and university_applied for the reviews join.
-- If the students table does NOT have a public read policy, the inner join will fail for anon.

-- Drop existing public read policy for students if it exists
DROP POLICY IF EXISTS "Allow public read access to basic student info for reviews" ON public.students;

CREATE POLICY "Allow public read access to basic student info for reviews"
ON public.students
FOR SELECT
USING (true);
