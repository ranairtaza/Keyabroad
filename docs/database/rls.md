# Row Level Security (RLS) Strategy

The ultimate security boundary is PostgreSQL RLS. Every table defaults to DENY.

## Core Policy Patterns

### 1. Student Access (Self-Service)
Students can only access rows linked to their `user_id`.
```sql
CREATE POLICY "student_select_own" ON student_documents
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
```

### 2. Counselor Access (Scoped)
Counselors can only access students assigned to them, plus unassigned leads.
```sql
CREATE POLICY "counselor_select_assigned" ON students
FOR SELECT USING (
  assigned_counselor_id = auth.uid() OR
  (SELECT staff_role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);
```

### 3. Admin Access (Global Operational)
Admins have broad read/write access to operational tables.
```sql
CREATE POLICY "admin_all" ON universities
FOR ALL USING (
  (SELECT staff_role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'content_manager')
);
```

### 4. Public Access (Read-Only)
Master data used by the public website is readable by anyone, writable by admins.
```sql
CREATE POLICY "public_read" ON universities
FOR SELECT USING (true);
```

## Audit Logging
Sensitive changes (e.g., updating a payment status) use PostgreSQL Triggers executed with `SECURITY DEFINER` to bypass RLS and securely write to `audit_logs` without granting the user direct insert access to the audit table.
