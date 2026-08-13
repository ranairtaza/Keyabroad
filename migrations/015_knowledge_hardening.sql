-- 015_knowledge_hardening.sql
-- Enforces strict db-level idempotency, versioning, and access control for RAG chunks

-- 1. Add schema expansion columns
ALTER TABLE knowledge_embeddings 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified',
ADD COLUMN IF NOT EXISTS document_id UUID,
ADD COLUMN IF NOT EXISTS version TEXT,
ADD COLUMN IF NOT EXISTS chunk_hash TEXT,
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'public';

-- 2. Enforce physical db-level idempotency to prevent duplicated chunk injections
-- A document_id and chunk_hash combination must be strictly unique.
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_idempotency ON knowledge_embeddings (document_id, chunk_hash);

-- 3. Backfill trigger invalidation helper (optional future-proofing for when catalog updates)
CREATE OR REPLACE FUNCTION trigger_ai_catalog_invalidation() RETURNS TRIGGER AS $$
BEGIN
    UPDATE knowledge_embeddings SET verification_status = 'outdated' 
    WHERE source_record_id = NEW.id AND source_type = TG_TABLE_NAME;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
