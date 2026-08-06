-- Run this in your Supabase SQL Editor!
-- This will disable Row Level Security on profiles to bypass the "infinite recursion" error caused by a conflicting policy.

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
