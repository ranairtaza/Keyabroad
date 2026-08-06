-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow full access to authenticated users (staff) for all tables
CREATE POLICY "Staff full access profiles" ON profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff full access team_members" ON team_members FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff full access students" ON students FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff full access enquiries" ON enquiries FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff full access registrations" ON registrations FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff full access fee_logs" ON fee_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff full access notifications" ON notifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff full access student_feedbacks" ON student_feedbacks FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff full access appointments" ON appointments FOR ALL TO authenticated USING (true);

-- Allow public inserts for forms (Feedback & Walk-in Leads)
CREATE POLICY "Public insert student_feedbacks" ON student_feedbacks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public insert enquiries" ON enquiries FOR INSERT TO public WITH CHECK (true);

-- Allow public read for profiles if needed for login context, else keep restricted
-- CREATE POLICY "Public read profiles" ON profiles FOR SELECT TO public USING (true);
