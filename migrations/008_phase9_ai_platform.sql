-- 008_phase9_ai_platform.sql
-- Enables pgvector and creates tables for AI Logging and RAG (Retrieval-Augmented Generation)

-- ============================================================================
-- 1. ENABLE PGVECTOR
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. KNOWLEDGE EMBEDDINGS (RAG)
-- Stores vectorized chunks of verified content for the AI to query
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB, -- Stores source URL, related university_id, etc.
    embedding vector(1536), -- Standard size for OpenAI text-embedding-3-small/ada-002
    source_type TEXT NOT NULL, -- e.g., 'university_policy', 'scholarship_rule', 'visa_guide'
    source_record_id UUID,
    verification_status TEXT DEFAULT 'verified',
    last_verified_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Completely block clients from querying the AI vector DB directly
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge_embeddings FROM anon, authenticated;
DROP POLICY IF EXISTS "Strict AI DB Shield" ON knowledge_embeddings;
CREATE POLICY "Strict AI DB Shield" ON knowledge_embeddings FOR ALL USING (false);

-- Automated Invalidation Trigger
CREATE OR REPLACE FUNCTION trigger_ai_invalidation() RETURNS TRIGGER AS $$
BEGIN
    UPDATE knowledge_embeddings SET verification_status = 'needs_update' 
    WHERE source_record_id = NEW.id AND source_type = TG_TABLE_NAME;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Invalidate AI vectors when actual catalog fields change
DROP TRIGGER IF EXISTS trg_ai_invalid_uni ON universities;
CREATE TRIGGER trg_ai_invalid_uni AFTER UPDATE OF status, verification_status, name, city, ranking, intake_months ON universities FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) EXECUTE FUNCTION trigger_ai_invalidation();

DROP TRIGGER IF EXISTS trg_ai_invalid_prog ON programs;
CREATE TRIGGER trg_ai_invalid_prog AFTER UPDATE OF status, verification_status, name, field_of_study, tuition_fee, duration, intake_months ON programs FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) EXECUTE FUNCTION trigger_ai_invalidation();

DROP TRIGGER IF EXISTS trg_ai_invalid_schol ON scholarships;
CREATE TRIGGER trg_ai_invalid_schol AFTER UPDATE OF status, verification_status, name, amount, coverage_type, eligibility_criteria ON scholarships FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) EXECUTE FUNCTION trigger_ai_invalidation();

-- Index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector 
ON knowledge_embeddings USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- 3. AI LOGGING (Sessions & Messages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    session_context JSONB, -- e.g., What page they were on, current profile state
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system', 'tool'
    content TEXT NOT NULL,
    tool_calls JSONB, -- If the AI invoked the Eligibility Engine tool
    sources_referenced JSONB, -- Array of knowledge_embeddings IDs used
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Security: Admins can review AI logs for quality control
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view AI sessions" ON ai_sessions;
CREATE POLICY "Admins view AI sessions" ON ai_sessions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IN ('super_admin', 'admin'))
    );

DROP POLICY IF EXISTS "Admins view AI messages" ON ai_messages;
CREATE POLICY "Admins view AI messages" ON ai_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IN ('super_admin', 'admin'))
    );
