-- ============================================================================
-- Migration: Phase 4 Biometric Gateway Machine Credentials & Idempotency
-- Description: Creates device_credentials table with canonical auth.users(id) actor references,
--              consecutive_error_count + historical error_count telemetry,
--              device-scoped idempotency index, and strict RLS policies.
-- ============================================================================

DO $$
BEGIN
    -- 1. Ensure telemetry columns on biometric_devices
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'biometric_devices' AND column_name = 'last_authenticated_at'
    ) THEN
        ALTER TABLE biometric_devices ADD COLUMN last_authenticated_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'biometric_devices' AND column_name = 'last_event_at'
    ) THEN
        ALTER TABLE biometric_devices ADD COLUMN last_event_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'biometric_devices' AND column_name = 'error_count'
    ) THEN
        ALTER TABLE biometric_devices ADD COLUMN error_count INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'biometric_devices' AND column_name = 'consecutive_error_count'
    ) THEN
        ALTER TABLE biometric_devices ADD COLUMN consecutive_error_count INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'biometric_devices' AND column_name = 'last_error'
    ) THEN
        ALTER TABLE biometric_devices ADD COLUMN last_error TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'biometric_devices' AND column_name = 'offline_threshold_minutes'
    ) THEN
        ALTER TABLE biometric_devices ADD COLUMN offline_threshold_minutes INTEGER NOT NULL DEFAULT 15;
    END IF;
END $$;

-- 2. Create device_credentials table with canonical auth.users(id) actor identity
CREATE TABLE IF NOT EXISTS device_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES biometric_devices(id) ON DELETE RESTRICT,
    key_name TEXT NOT NULL DEFAULT 'Primary Device API Key',
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    last_used_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast credential lookup by hash
CREATE INDEX IF NOT EXISTS idx_device_credentials_key_hash 
    ON device_credentials(key_hash);

-- Index for device credential lookup
CREATE INDEX IF NOT EXISTS idx_device_credentials_device_id 
    ON device_credentials(device_id);

-- 3. Device-Scoped Database Idempotency
DROP INDEX IF EXISTS idx_attendance_events_external_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_events_device_external_id 
    ON attendance_events(device_id, external_event_id) 
    WHERE external_event_id IS NOT NULL;

-- 4. Enable RLS on device_credentials
ALTER TABLE device_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and HR can manage device credentials" ON device_credentials;
DROP POLICY IF EXISTS "Admins and HR can view device credentials" ON device_credentials;

-- Strict RBAC Policy using canonical roles
CREATE POLICY "Admins and HR can manage device credentials" 
    ON device_credentials
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'owner', 'hr', 'operations head')
        )
        OR
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.email = auth.jwt()->>'email'
            AND team_members.role IN ('Admin', 'Super Admin', 'Owner', 'HR', 'HR Manager', 'Operations Head', 'CEO', 'Founder')
        )
    );
