-- 007_phase8_student_portal.sql
-- Expands the student portal schema with shortlists, pre-departure checklists, and visa tracking.

-- ============================================================================
-- 1. STUDENT SHORTLISTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_shortlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    CONSTRAINT chk_shortlist_target CHECK (university_id IS NOT NULL OR program_id IS NOT NULL)
);

-- Partial Unique Indexes for accurate deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_shortlists_program 
    ON student_shortlists (student_id, program_id) 
    WHERE program_id IS NOT NULL;
    
CREATE UNIQUE INDEX IF NOT EXISTS idx_shortlists_university 
    ON student_shortlists (student_id, university_id) 
    WHERE program_id IS NULL AND university_id IS NOT NULL;

-- Consistency trigger
CREATE OR REPLACE FUNCTION verify_program_university_match() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.program_id IS NOT NULL AND NEW.university_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM programs WHERE id = NEW.program_id AND university_id = NEW.university_id) THEN
            RAISE EXCEPTION 'Consistency Error: Program does not belong to the specified University';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verify_program_university_match ON student_shortlists;
CREATE TRIGGER trg_verify_program_university_match
BEFORE INSERT OR UPDATE ON student_shortlists
FOR EACH ROW EXECUTE FUNCTION verify_program_university_match();

ALTER TABLE student_shortlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own shortlists" ON student_shortlists;
CREATE POLICY "Students manage own shortlists" ON student_shortlists
    FOR ALL USING (
        EXISTS (SELECT 1 FROM students WHERE students.id = student_shortlists.student_id AND students.user_id = auth.uid())
    );

-- ============================================================================
-- 2. PRE-DEPARTURE CHECKLISTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS predeparture_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    application_id UUID REFERENCES student_applications(id) ON DELETE CASCADE,
    
    -- Checklist Items (Boolean tracking)
    documents_ready BOOLEAN DEFAULT FALSE,
    flight_booked BOOLEAN DEFAULT FALSE,
    accommodation_secured BOOLEAN DEFAULT FALSE,
    insurance_purchased BOOLEAN DEFAULT FALSE,
    orientation_completed BOOLEAN DEFAULT FALSE,
    arrival_notified BOOLEAN DEFAULT FALSE,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(application_id)
);

ALTER TABLE predeparture_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own predeparture" ON predeparture_checklists;
CREATE POLICY "Students view own predeparture" ON predeparture_checklists
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM students WHERE students.id = predeparture_checklists.student_id AND students.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Staff manage predeparture" ON predeparture_checklists;
CREATE POLICY "Staff manage predeparture" ON predeparture_checklists
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IS NOT NULL)
    );

-- ============================================================================
-- 3. VISA WORKFLOW (Added to Applications)
-- ============================================================================
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS visa_status TEXT DEFAULT 'not_started'; 
-- e.g. not_started, documents_gathering, applied, biometrics_done, interview_scheduled, approved, rejected
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS visa_appointment_date TIMESTAMPTZ;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS visa_decision_date TIMESTAMPTZ;
