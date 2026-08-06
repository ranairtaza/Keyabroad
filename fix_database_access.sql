-- Run this in your Supabase SQL Editor to fix the database access and missing buckets!

-- 1. Fix access to students table
DROP POLICY IF EXISTS "Allow authenticated users to read students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to insert students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to update students" ON students;

DROP POLICY IF EXISTS "Enable all for public on students" ON students;
CREATE POLICY "Enable all for public on students" ON students FOR ALL USING (true) WITH CHECK (true);

-- 2. Fix access to fee_logs table
DROP POLICY IF EXISTS "Enable all for public on fee_logs" ON fee_logs;
CREATE POLICY "Enable all for public on fee_logs" ON fee_logs FOR ALL USING (true) WITH CHECK (true);

-- 3. Fix access to notifications table
DROP POLICY IF EXISTS "Enable all for public on notifications" ON notifications;
CREATE POLICY "Enable all for public on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- 4. Fix Storage Bucket for student files
INSERT INTO storage.buckets (id, name, public) VALUES ('student_files', 'student_files', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'student_files') WITH CHECK (bucket_id = 'student_files');
