-- PHASE 8 MIGRATION
-- Adding last_seen column to track when a user was last online

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;
