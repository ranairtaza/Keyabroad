-- PHASE 6 MIGRATION
-- Adding phone column to profiles to track the office WhatsApp number

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
