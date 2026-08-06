-- Run this in your Supabase SQL Editor to fix the missing columns error!

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS test TEXT,
ADD COLUMN IF NOT EXISTS target_score TEXT,
ADD COLUMN IF NOT EXISTS assignee TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE enquiries
ADD COLUMN IF NOT EXISTS assignee TEXT;
