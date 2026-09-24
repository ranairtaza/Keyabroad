-- =================================================================================
-- PHASE 4: BIOMETRIC HARDWARE TEST MODE
-- =================================================================================

-- 1. BIOMETRIC DEVICES
-- Add test mode indicator and expiration to biometric_devices
ALTER TABLE biometric_devices 
ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'LIVE' CHECK (mode IN ('LIVE', 'TEST')),
ADD COLUMN IF NOT EXISTS test_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_biometric_devices_mode ON biometric_devices(mode);

-- 2. ATTENDANCE EVENTS
-- Add test isolation flag to attendance_events
ALTER TABLE attendance_events 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_attendance_events_is_test ON attendance_events(is_test);

-- 3. ACTIVITY LOGS
-- (No schema changes required, activity logs are handled via the existing logic)
