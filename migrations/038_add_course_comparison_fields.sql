-- 038_add_course_comparison_fields.sql

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS intakes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gpa_requirement TEXT,
ADD COLUMN IF NOT EXISTS work_rights TEXT;