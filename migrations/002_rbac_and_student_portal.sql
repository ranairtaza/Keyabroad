-- ============================================================================
-- MIGRATION 002: ROLE-BASED ACCESS CONTROL FOUNDATION
-- ============================================================================
-- PURPOSE: Add proper role enum and staff_role column to profiles table,
--          create student_accounts table for student portal auth,
--          and add user_id FK to students table for data isolation.
-- RUN IN: Supabase SQL Editor
-- 
-- IMPORTANT: This migration ADDS columns and tables. It does NOT delete or
-- modify existing data. All existing workflows continue to work.
-- ============================================================================

-- ============================================================================
-- 1. STAFF ROLES — Add structured role column to profiles
-- ============================================================================

-- Create the role enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
    CREATE TYPE staff_role AS ENUM (
      'super_admin',
      'admin',
      'branch_manager',
      'counselor',
      'admission_officer',
      'visa_officer',
      'content_manager',
      'marketing_staff',
      'finance_staff',
      'intern'
    );
  END IF;
END
$$;

-- Add the typed role column (preserving existing TEXT 'role' column)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_role staff_role DEFAULT 'counselor';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- ============================================================================
-- 2. STUDENT ACCOUNTS — For student portal authentication
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_accounts ENABLE ROW LEVEL SECURITY;

-- Students can only see their own account
CREATE POLICY "student_accounts_select_own"
  ON student_accounts FOR SELECT
  USING (auth.uid() = id);

-- Students can update their own account
CREATE POLICY "student_accounts_update_own"
  ON student_accounts FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Staff can see all student accounts
CREATE POLICY "student_accounts_select_staff"
  ON student_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.staff_role IS NOT NULL
    )
  );

-- Staff can manage student accounts
CREATE POLICY "student_accounts_all_staff"
  ON student_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.staff_role IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.staff_role IS NOT NULL
    )
  );

-- ============================================================================
-- 3. STUDENTS TABLE — Add user_id for data isolation
-- ============================================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_counselor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_assigned_counselor ON students(assigned_counselor_id);

-- ============================================================================
-- 4. DOCUMENTS TABLE — Secure student document management
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other', -- 'passport', 'academic', 'financial', 'visa', 'other'
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- Students can only see their own documents
CREATE POLICY "student_documents_select_own"
  ON student_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_documents.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Students can upload their own documents
CREATE POLICY "student_documents_insert_own"
  ON student_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_documents.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Staff can manage all documents
CREATE POLICY "student_documents_all_staff"
  ON student_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.staff_role IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.staff_role IS NOT NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_student_documents_student ON student_documents(student_id);

-- ============================================================================
-- 5. MESSAGES TABLE — Student-counselor messaging
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'archived'
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES student_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'student', -- 'student' or 'staff'
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_conversations ENABLE ROW LEVEL SECURITY;

-- Participants can see messages in their conversations
CREATE POLICY "student_messages_select_participant"
  ON student_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_conversations c
      JOIN students s ON c.student_id = s.id
      WHERE c.id = student_messages.conversation_id
      AND (
        s.user_id = auth.uid()  -- student
        OR c.counselor_id = auth.uid()  -- assigned counselor
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)  -- any staff
      )
    )
  );

-- Participants can send messages
CREATE POLICY "student_messages_insert_participant"
  ON student_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM student_conversations c
      JOIN students s ON c.student_id = s.id
      WHERE c.id = student_messages.conversation_id
      AND (
        s.user_id = auth.uid()
        OR c.counselor_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
      )
    )
  );

-- Conversation access policies
CREATE POLICY "student_conversations_select_participant"
  ON student_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_conversations.student_id
      AND s.user_id = auth.uid()
    )
    OR counselor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
  );

CREATE POLICY "student_conversations_all_staff"
  ON student_conversations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
  );

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE student_messages;

CREATE INDEX IF NOT EXISTS idx_student_messages_conversation ON student_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_student_conversations_student ON student_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_conversations_counselor ON student_conversations(counselor_id);

-- ============================================================================
-- 6. APPLICATIONS TABLE — Formal student application tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  university_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  country TEXT NOT NULL,
  intake TEXT,
  status TEXT DEFAULT 'draft', 
    -- 'draft', 'submitted', 'under_review', 'conditional_offer', 
    -- 'unconditional_offer', 'accepted', 'rejected', 'withdrawn'
  submitted_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,
  managed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_applications ENABLE ROW LEVEL SECURITY;

-- Students see their own applications
CREATE POLICY "student_applications_select_own"
  ON student_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_applications.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Staff can manage all applications
CREATE POLICY "student_applications_all_staff"
  ON student_applications FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_student_applications_student ON student_applications(student_id);
