-- Add description column to team_members for the About section
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS description TEXT;
