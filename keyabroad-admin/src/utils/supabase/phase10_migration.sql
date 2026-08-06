-- Migration: Phase 10 - Workflow Automations

CREATE TABLE IF NOT EXISTS workflow_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- e.g., 'lead_created', 'lead_status_updated'
    trigger_conditions JSONB DEFAULT '{}'::jsonb, -- e.g., {"source": "Website"}
    action_type TEXT NOT NULL, -- e.g., 'create_task', 'send_email', 'send_whatsapp'
    action_payload JSONB DEFAULT '{}'::jsonb, -- e.g., {"task_title": "Schedule Visa Consultation", "assignee": "Counselor 1"}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and set policies
ALTER TABLE workflow_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON workflow_automations;
CREATE POLICY "Enable all for authenticated users" ON workflow_automations FOR ALL USING (true) WITH CHECK (true);

-- We also create a trigger function that can be hooked up to pg_net for webhooks if desired later,
-- but the recommended approach is setting up the Webhook via Supabase Dashboard UI 
-- (Database -> Webhooks) pointing to your production /api/automations/webhook endpoint.
