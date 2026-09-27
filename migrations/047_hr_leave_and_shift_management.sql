BEGIN;

-- 1. Leave Types
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_days INTEGER NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id INTEGER NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_accrued NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_used NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- 3. Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id INTEGER NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC(5,2) NOT NULL CHECK (total_days > 0),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- 4. Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_period_minutes INTEGER NOT NULL DEFAULT 0,
  break_duration_minutes INTEGER NOT NULL DEFAULT 0,
  minimum_working_minutes INTEGER NOT NULL DEFAULT 0,
  overtime_threshold_minutes INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Employee Shifts
CREATE TABLE IF NOT EXISTS employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id INTEGER NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
  effective_from DATE NOT NULL,
  effective_to DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_effective_range CHECK (effective_to IS NULL OR effective_from <= effective_to)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leave_types_updated_at BEFORE UPDATE ON leave_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_shifts_updated_at BEFORE UPDATE ON employee_shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Setup
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;

-- Leave Types: All authenticated can read. HR/Admin can modify.
CREATE POLICY "Leave types are viewable by all authenticated users" ON leave_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leave types are modifiable by admins and hr" ON leave_types FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email' AND role IN ('OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'))
);

-- Leave Balances: Employees can view their own. HR/Admin can read/modify all.
CREATE POLICY "Employees can view own leave balances" ON leave_balances FOR SELECT USING (
  employee_id IN (SELECT id FROM team_members WHERE email = auth.jwt()->>'email') OR
  EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email' AND role IN ('OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'))
);
CREATE POLICY "Admins can modify leave balances" ON leave_balances FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email' AND role IN ('OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'))
);

-- Leave Requests: Employees can view and create their own, cancel pending. HR/Admin can do all.
CREATE POLICY "Employees can view own leave requests" ON leave_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM team_members WHERE email = auth.jwt()->>'email') OR
  EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email' AND role IN ('OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'))
);
CREATE POLICY "Employees can create own leave requests" ON leave_requests FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM team_members WHERE email = auth.jwt()->>'email')
);
CREATE POLICY "Employees can update own pending leave requests" ON leave_requests FOR UPDATE USING (
  employee_id IN (SELECT id FROM team_members WHERE email = auth.jwt()->>'email') AND status = 'PENDING'
) WITH CHECK (
  employee_id IN (SELECT id FROM team_members WHERE email = auth.jwt()->>'email') AND (status = 'CANCELLED' OR status = 'PENDING')
);
CREATE POLICY "Admins can manage all leave requests" ON leave_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email' AND role IN ('OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'))
);

-- Shifts: All authenticated can read active shifts. HR/Admin can read all and modify.
CREATE POLICY "Shifts viewable by authenticated users" ON shifts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can modify shifts" ON shifts FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email' AND role IN ('OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'))
);

-- Employee Shifts: Employees can view their own. HR/Admin can read/modify all.
CREATE POLICY "Employees can view own shifts" ON employee_shifts FOR SELECT USING (
  employee_id IN (SELECT id FROM team_members WHERE email = auth.jwt()->>'email') OR
  EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email' AND role IN ('OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'))
);
CREATE POLICY "Admins can modify employee shifts" ON employee_shifts FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email' AND role IN ('OWNER', 'ADMIN', 'HR', 'OPERATIONS HEAD'))
);

-- Pre-seed some default leave types
INSERT INTO leave_types (name, description, default_days, is_paid) VALUES
('Annual Leave', 'Standard paid time off', 20, true),
('Sick Leave', 'Paid sick leave', 10, true),
('Casual Leave', 'Short term casual leave', 5, true),
('Unpaid Leave', 'Leave without pay', 0, false)
ON CONFLICT (name) DO NOTHING;

-- Pre-seed a default shift (9 to 6)
INSERT INTO shifts (name, start_time, end_time, grace_period_minutes, break_duration_minutes, minimum_working_minutes, overtime_threshold_minutes) VALUES
('Standard Shift (9-6)', '09:00:00', '18:00:00', 15, 60, 240, 60)
ON CONFLICT (name) DO NOTHING;

COMMIT;
