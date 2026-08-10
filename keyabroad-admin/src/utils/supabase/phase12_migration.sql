-- Phase 12 Migration
-- Ensure task tables have completed_at and completed_by columns

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS completed_by TEXT;

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS completed_by TEXT;

ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS completed_by TEXT;

ALTER TABLE office_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE office_tasks ADD COLUMN IF NOT EXISTS completed_by TEXT;
