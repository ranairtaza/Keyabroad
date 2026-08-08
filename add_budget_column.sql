-- Add a budget column to the students table to support the Google Sheets layout
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS budget text;
