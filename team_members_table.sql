-- Run this in your Supabase SQL Editor to create the Team Members table

CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    location TEXT,
    joined TEXT,
    salary TEXT,
    image TEXT,
    
    status TEXT DEFAULT 'active', -- 'active' or 'resigned'
    worked_from TEXT,
    worked_to TEXT
);

-- Seed with initial dummy data to match the UI you had before
INSERT INTO team_members (name, role, email, location, joined, salary, image, status) VALUES 
('Ahmed Raza', 'Lead Educational Counsellor', 'ahmed@keyabroad.com', 'Lahore Office', 'Jan 2020', '$4,500/mo', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=80', 'active'),
('Sarah Khan', 'Visa Processing Specialist', 'sarah@keyabroad.com', 'Islamabad Office', 'Mar 2021', '$3,800/mo', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80', 'active'),
('Usman Tariq', 'Career Guidance Expert', 'usman@keyabroad.com', 'Lahore Office', 'Nov 2022', '$3,200/mo', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&q=80', 'active'),
('Fatima Noor', 'Student Success Coordinator', 'fatima@keyabroad.com', 'Karachi Office', 'Jun 2023', '$2,800/mo', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&q=80', 'active');

INSERT INTO team_members (name, role, email, worked_from, worked_to, image, status) VALUES 
('Ali Hamza', 'Marketing Executive', 'ali.h@keyabroad.com', 'Feb 2019', 'Dec 2021', 'https://ui-avatars.com/api/?name=Ali+Hamza&background=0D8ABC&color=fff', 'resigned');

-- Enable RLS for security, but allow all inserts/updates for the admin dashboard
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON team_members;
CREATE POLICY "Enable all for authenticated users" ON team_members FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for public" ON team_members;
CREATE POLICY "Enable all for public" ON team_members FOR ALL USING (true) WITH CHECK (true);
