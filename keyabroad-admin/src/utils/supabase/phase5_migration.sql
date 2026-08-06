-- PHASE 5 MIGRATION
-- Adding live data tables for Visas, Invoices, and Universities

-- 1. Visas Table (for the drag-and-drop Kanban board)
CREATE TABLE IF NOT EXISTS visas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student TEXT NOT NULL,
    destination TEXT NOT NULL,
    course TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'doc-prep', -- 'doc-prep', 'applied', 'interview', 'approved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Invoices Table (for the finance tracker)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number TEXT NOT NULL, -- e.g. INV-2026-001
    student TEXT NOT NULL,
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL, -- 'Processing Fee', 'Visa Fee', 'Consultation'
    status TEXT NOT NULL DEFAULT 'Unpaid', -- 'Paid', 'Unpaid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Universities Table (for the knowledge base)
-- The table might already exist from the Course Matcher, so we use ALTER TABLE to add missing columns
ALTER TABLE universities ADD COLUMN IF NOT EXISTS reqs TEXT DEFAULT 'N/A';
ALTER TABLE universities ADD COLUMN IF NOT EXISTS intake TEXT DEFAULT 'Rolling';
ALTER TABLE universities ADD COLUMN IF NOT EXISTS deadline TEXT DEFAULT 'TBA';
ALTER TABLE universities ADD COLUMN IF NOT EXISTS commission TEXT DEFAULT '$0';

-- Set up Row Level Security (RLS) policies
-- Note: Simplified for the admin panel; in production, strict auth checks are recommended.
ALTER TABLE visas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users on visas" ON visas;
CREATE POLICY "Enable all for authenticated users on visas" ON visas FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users on invoices" ON invoices;
CREATE POLICY "Enable all for authenticated users on invoices" ON invoices FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users on universities" ON universities;
CREATE POLICY "Enable all for authenticated users on universities" ON universities FOR ALL USING (auth.role() = 'authenticated');

-- Insert initial data so the dashboard isn't completely empty when you load it
INSERT INTO universities (name, country, reqs, intake, deadline, commission) VALUES 
('University of Toronto', 'Canada', 'GPA 3.0, IELTS 6.5', 'Fall 2026 (Sept)', 'Jan 15, 2026', '$1,500'),
('University of Melbourne', 'Australia', 'GPA 3.2, IELTS 7.0', 'Spring 2026 (Feb)', 'Oct 30, 2025', '$2,000');

INSERT INTO visas (student, destination, course, date, status) VALUES 
('Ali Raza', 'UK', 'MSc Computer Science', 'Sep 2026 Intake', 'doc-prep'),
('Fatima Noor', 'USA', 'BSc Finance', 'Oct 15, 10:00 AM', 'interview');

INSERT INTO invoices (invoice_number, student, date, amount, type, status) VALUES 
('INV-2026-001', 'Ali Raza', 'Jul 25, 2026', 500, 'Processing Fee', 'Paid'),
('INV-2026-002', 'Ahmed Khan', 'Jul 26, 2026', 1500, 'University Deposit', 'Unpaid');
