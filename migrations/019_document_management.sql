-- 019_document_management.sql

-- Cleanup from any previous aborted/flawed runs
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.student_documents CASCADE;
DROP TABLE IF EXISTS public.document_types CASCADE;

-- Create update_modified_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Document Types Table (Extensible Catalog)
CREATE TABLE public.document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    required_by_default BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial document types
INSERT INTO public.document_types (name, category, description, required_by_default) VALUES
    ('Passport', 'Identity', 'Valid passport copy', true),
    ('Academic Transcript', 'Academic', 'High school or university transcripts', true),
    ('Degree / Certificate', 'Academic', 'Graduation certificate', false),
    ('IELTS / PTE', 'Language', 'English proficiency test scores', false),
    ('Financial Statement', 'Financial', 'Proof of funds for visa/tuition', false),
    ('Bank Statement', 'Financial', 'Last 6 months bank statement', false),
    ('Recommendation Letter', 'Supporting', 'Letter from teacher or employer', false),
    ('SOP', 'Supporting', 'Statement of Purpose', false),
    ('CV', 'Supporting', 'Curriculum Vitae / Resume', false),
    ('Offer Letter', 'University', 'University admission offer letter', false),
    ('Visa Document', 'Immigration', 'Approved visa or related immigration docs', false);

-- Enable RLS for document_types
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active document types"
    ON public.document_types FOR SELECT
    TO authenticated
    USING (active = true);

CREATE POLICY "Staff can manage document types"
    ON public.document_types FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL));


-- 2. Student Documents Table
CREATE TABLE public.student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES public.document_types(id),
    storage_path TEXT NOT NULL, -- students/{student_id}/documents/{document_id}/file.ext
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    rejection_reason TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_student_documents_student_id ON public.student_documents(student_id);
CREATE INDEX idx_student_documents_status ON public.student_documents(verification_status);

-- Enable RLS for student_documents
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- Document RLS Policies
CREATE POLICY "Students can view their own documents"
    ON public.student_documents FOR SELECT
    TO authenticated
    USING (student_id = (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can insert their own documents"
    ON public.student_documents FOR INSERT
    TO authenticated
    WITH CHECK (student_id = (SELECT id FROM public.students WHERE user_id = auth.uid()) AND verification_status = 'pending');

CREATE POLICY "Students can delete their own pending documents"
    ON public.student_documents FOR DELETE
    TO authenticated
    USING (student_id = (SELECT id FROM public.students WHERE user_id = auth.uid()) AND verification_status = 'pending');

CREATE POLICY "Staff can view all documents"
    ON public.student_documents FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL));

CREATE POLICY "Staff can update document status"
    ON public.student_documents FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL));


-- 3. Triggers for updated_at
CREATE TRIGGER update_document_types_modtime
    BEFORE UPDATE ON public.document_types
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_student_documents_modtime
    BEFORE UPDATE ON public.student_documents
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 4. Notification Triggers for Documents
CREATE OR REPLACE FUNCTION notify_document_event()
RETURNS TRIGGER AS $$
DECLARE
  v_student_user_id UUID;
  v_counselor_id UUID;
  v_document_name TEXT;
BEGIN
  -- Get Student User ID
  SELECT user_id INTO v_student_user_id FROM public.students WHERE id = NEW.student_id;
  
  -- Get Document Name
  SELECT name INTO v_document_name FROM public.document_types WHERE id = NEW.document_type_id;

  -- Notify Counselor on new upload (Pending)
  IF TG_OP = 'INSERT' AND NEW.verification_status = 'pending' THEN
    -- Find assigned counselor if any (simplified: notify all staff or specific counselor if known)
    -- For now, we'll insert a generic notification for CRM users
    INSERT INTO notifications (recipient, message)
    VALUES ('CRM', 'New document uploaded: ' || v_document_name || ' requires verification.');
  END IF;

  -- Notify Student on status change (Verified/Rejected)
  IF TG_OP = 'UPDATE' AND OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    IF NEW.verification_status = 'verified' THEN
      INSERT INTO notifications (user_id, recipient, message)
      VALUES (v_student_user_id, v_student_user_id::text, 'Your document (' || v_document_name || ') has been verified.');
    ELSIF NEW.verification_status = 'rejected' THEN
      INSERT INTO notifications (user_id, recipient, message)
      VALUES (v_student_user_id, v_student_user_id::text, 'Your document (' || v_document_name || ') was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided.'));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_document_notification
  AFTER INSERT OR UPDATE OF verification_status ON public.student_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_document_event();

-- 5. Storage Bucket & Security Policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-documents', 'student-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Students can upload/view their own documents
CREATE POLICY "Students can upload own documents"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'student-documents' AND
    (storage.foldername(name))[1] = 'students' AND
    (storage.foldername(name))[2] = (SELECT id::text FROM public.students WHERE user_id = auth.uid())
);

CREATE POLICY "Students can view own documents"
ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'student-documents' AND
    (storage.foldername(name))[1] = 'students' AND
    (storage.foldername(name))[2] = (SELECT id::text FROM public.students WHERE user_id = auth.uid())
);

-- Storage RLS: Staff can view all documents
CREATE POLICY "Staff can view all documents"
ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'student-documents' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
);

