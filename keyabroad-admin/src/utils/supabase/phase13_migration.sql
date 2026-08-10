-- Phase 13 Migration
-- Add priority and deadline columns to task tables for extreme notification and alerting system

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

ALTER TABLE office_tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE office_tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
