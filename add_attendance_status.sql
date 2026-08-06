-- Add status column to employee_attendance for tracking 'present' or 'leave'
ALTER TABLE public.employee_attendance 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'present';
