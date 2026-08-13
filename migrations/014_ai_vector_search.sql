-- 014_ai_vector_search.sql
-- Creates the pgvector similarity search RPC function for the AI RAG pipeline

-- Ensure verification_status exists on the table so the function compilation doesn't fail
ALTER TABLE knowledge_embeddings ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';

-- Function: match_knowledge_embeddings
-- Purpose: Performs cosine similarity search on the knowledge_embeddings table
-- Arguments:
--   query_embedding: The vectorized user query (1536 dimensions for OpenAI ada-002)
--   match_threshold: The minimum similarity score to return (e.g. 0.7)
--   match_count: Maximum number of chunks to return
CREATE OR REPLACE FUNCTION match_knowledge_embeddings (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  source_type text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    source_type,
    1 - (knowledge_embeddings.embedding <=> query_embedding) AS similarity
  FROM
    knowledge_embeddings
  WHERE
    verification_status = 'verified' -- Ensure we only feed verified ground truth to the AI
    AND 1 - (knowledge_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY
    knowledge_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;
