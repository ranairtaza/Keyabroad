-- Add check_out_time column to employee_attendance for tracking check out times
ALTER TABLE public.employee_attendance 
ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP WITH TIME ZONE;

-- Also explicitly ensure update policy exists
DROP POLICY IF EXISTS "Enable update for public" ON employee_attendance;
CREATE POLICY "Enable update for public" ON employee_attendance FOR UPDATE USING (true) WITH CHECK (true);
