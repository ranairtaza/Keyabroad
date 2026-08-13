-- 013_student_storage_policies.sql
-- Provisions the student-documents storage bucket and applies strict multi-tenant RLS.
-- This ensures that Student A can NEVER download Student B's physical files.

-- Note: Executing without an explicit transaction block to prevent deadlocks on live databases.

-- 1. Create the bucket (Strictly Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Ensure RLS is enabled on storage.objects
-- (Omitted: Supabase enables this by default, and ALTER TABLE throws ownership errors)
-- Drop any potential existing policies for a clean state
DROP POLICY IF EXISTS "Staff can manage all student documents" ON storage.objects;
DROP POLICY IF EXISTS "Students can access their own folder" ON storage.objects;

-- 3. Create Isolation Policies

-- Policy A: Staff have full access to the bucket
CREATE POLICY "Staff can manage all student documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'student-documents' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
);

-- Policy B: Students are strictly isolated to their own folder path
-- The folder structure must be: /student-documents/[student_id]/[file_name]
-- Supabase `storage.foldername(name)[1]` extracts the first folder segment
CREATE POLICY "Students can access their own folder"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'student-documents' 
  AND (storage.foldername(name))[1] = (
      SELECT student_id::text 
      FROM public.student_accounts 
      WHERE student_accounts.id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'student-documents' 
  AND (storage.foldername(name))[1] = (
      SELECT student_id::text 
      FROM public.student_accounts 
      WHERE student_accounts.id = auth.uid()
  )
);
