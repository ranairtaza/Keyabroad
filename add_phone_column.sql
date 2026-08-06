-- Add phone column to the profiles table to support employee phone numbers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
