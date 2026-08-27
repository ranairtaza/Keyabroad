-- 039_add_comparison_to_universities.sql

ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS intakes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gpa_requirement TEXT,
ADD COLUMN IF NOT EXISTS work_rights TEXT;