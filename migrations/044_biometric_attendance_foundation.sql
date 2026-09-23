-- =================================================================================
-- PHASE 3: VENDOR-NEUTRAL BIOMETRIC ATTENDANCE FOUNDATION MIGRATION
-- =================================================================================

-- 1. BIOMETRIC DEVICE REGISTRY
-- Registry of all physical or virtual biometric terminals across branches.
-- Manufacturer is open-ended TEXT to support any future hardware vendor.
CREATE TABLE IF NOT EXISTS biometric_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT NOT NULL UNIQUE,
    branch_location TEXT NOT NULL DEFAULT 'Main Office',
    connection_type TEXT NOT NULL DEFAULT 'ETHERNET',
    adapter_type TEXT NOT NULL DEFAULT 'GENERIC_PULL',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    api_key_hash TEXT,
    last_heartbeat TIMESTAMPTZ,
    last_sync TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_biometric_devices_serial ON biometric_devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_biometric_devices_status ON biometric_devices(status);
CREATE INDEX IF NOT EXISTS idx_biometric_devices_branch ON biometric_devices(branch_location);


-- 2. EMPLOYEE BIOMETRIC IDENTITY MAPPINGS
-- Safely maps existing team_members to device-scoped or global biometric user IDs.
-- Supports multi-device, multi-branch, and non-global biometric terminal IDs.
CREATE TABLE IF NOT EXISTS employee_biometric_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id INTEGER NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
    device_id UUID REFERENCES biometric_devices(id) ON DELETE RESTRICT,
    biometric_user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device-scoped uniqueness: a biometric_user_id is unique per device
CREATE UNIQUE INDEX IF NOT EXISTS uq_device_biometric_user 
ON employee_biometric_mappings(device_id, biometric_user_id) 
WHERE device_id IS NOT NULL;

-- Global-scoped uniqueness: when device_id IS NULL (applies across all devices)
CREATE UNIQUE INDEX IF NOT EXISTS uq_global_biometric_user 
ON employee_biometric_mappings(biometric_user_id) 
WHERE device_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_emp_biometric_mappings_emp_id ON employee_biometric_mappings(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_biometric_mappings_lookup ON employee_biometric_mappings(biometric_user_id, status);


-- 3. ATTENDANCE EVENTS (RAW & NORMALIZED AUDIT LEDGER)
-- Immutable ledger of normalized biometric events received from any adapter/gateway.
-- Includes full deduplication keys, resolution status, and raw metadata.
CREATE TABLE IF NOT EXISTS attendance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES biometric_devices(id) ON DELETE RESTRICT,
    employee_id INTEGER REFERENCES team_members(id) ON DELETE RESTRICT,
    biometric_user_id TEXT NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'CHECK_IN',
    verification_method TEXT NOT NULL DEFAULT 'FINGERPRINT',
    external_event_id TEXT,
    idempotency_hash TEXT UNIQUE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    processing_status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'UNMATCHED', 'FAILED', 'IGNORED')),
    processing_error TEXT,
    raw_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_events_device_id ON attendance_events(device_id);
CREATE INDEX IF NOT EXISTS idx_attendance_events_employee_id ON attendance_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_events_timestamp ON attendance_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_events_status ON attendance_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_attendance_events_idempotency ON attendance_events(idempotency_hash);


-- 4. ROW LEVEL SECURITY POLICIES

-- 4.1 Biometric Devices RLS
ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "biometric_devices_admin_select" ON biometric_devices;
DROP POLICY IF EXISTS "biometric_devices_admin_modify" ON biometric_devices;

CREATE POLICY "biometric_devices_admin_select" ON biometric_devices FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%' OR role ILIKE '%hr%')
  OR auth.jwt()->>'email' = 'junaid@keyabroad.com'
);

CREATE POLICY "biometric_devices_admin_modify" ON biometric_devices FOR ALL TO authenticated
USING (
  auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%')
  OR auth.jwt()->>'email' = 'junaid@keyabroad.com'
)
WITH CHECK (
  auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%')
  OR auth.jwt()->>'email' = 'junaid@keyabroad.com'
);

-- 4.2 Employee Biometric Mappings RLS
ALTER TABLE employee_biometric_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "emp_biometric_mappings_select" ON employee_biometric_mappings;
DROP POLICY IF EXISTS "emp_biometric_mappings_admin_modify" ON employee_biometric_mappings;

-- Normal employees can view only their own mapping. Admins/HR can view all.
CREATE POLICY "emp_biometric_mappings_select" ON employee_biometric_mappings FOR SELECT TO authenticated
USING (
  employee_id = (SELECT id FROM team_members WHERE email = auth.jwt()->>'email')
  OR
  auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%' OR role ILIKE '%hr%')
  OR auth.jwt()->>'email' = 'junaid@keyabroad.com'
);

-- Only Admins/Owners can create/modify biometric mappings
CREATE POLICY "emp_biometric_mappings_admin_modify" ON employee_biometric_mappings FOR ALL TO authenticated
USING (
  auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%')
  OR auth.jwt()->>'email' = 'junaid@keyabroad.com'
)
WITH CHECK (
  auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%')
  OR auth.jwt()->>'email' = 'junaid@keyabroad.com'
);

-- 4.3 Attendance Events RLS
ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_events_admin_select" ON attendance_events;

-- Only Admins/HR can view raw attendance events (normal employees cannot inspect raw event telemetry)
CREATE POLICY "attendance_events_admin_select" ON attendance_events FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (SELECT email FROM team_members WHERE role ILIKE '%admin%' OR role ILIKE '%ceo%' OR role ILIKE '%founder%' OR role ILIKE '%hr%')
  OR auth.jwt()->>'email' = 'junaid@keyabroad.com'
);

-- NOTE: Ingestion and event writes occur strictly via trusted server APIs using the Service Role.
-- Direct client writes to attendance_events are disabled.

-- =================================================================================
-- END OF PHASE 3 MIGRATION
-- =================================================================================
