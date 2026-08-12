-- Phase 4 Migration for Keyabroad Supabase

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert by authenticated users
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON audit_logs;
CREATE POLICY "Enable insert for authenticated users only" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow select by owners only (requires fetching user role, simple policy for now)
DROP POLICY IF EXISTS "Enable select for authenticated users" ON audit_logs;
CREATE POLICY "Enable select for authenticated users" ON audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Create integrations table for API keys (encrypted in a real scenario)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE, -- 'twilio', 'zoom', 'openai'
  api_key TEXT,
  secret_key TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON integrations;
CREATE POLICY "Enable all for authenticated users" ON integrations
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default integration stubs
INSERT INTO integrations (provider, is_active) VALUES ('twilio', false) ON CONFLICT DO NOTHING;
INSERT INTO integrations (provider, is_active) VALUES ('zoom', false) ON CONFLICT DO NOTHING;
INSERT INTO integrations (provider, is_active) VALUES ('openai', false) ON CONFLICT DO NOTHING;
