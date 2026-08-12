-- PHASE 9 MIGRATION
-- Adding 'source' column to track where leads came from (online vs walk-in)

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'online';
