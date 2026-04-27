-- ============================================================================
-- Northbridge RAG: prose corpus + vector embeddings (Session 2)
--
-- Stores handbook pages, FAQs, policies, and course catalog text as kb_documents,
-- chunked for embedding. The chatbot retrieves relevant chunks via cosine
-- similarity against pgvector and grounds answers with citations.
--
-- Named kb_* to avoid collision with the existing public.documents table
-- (user-uploaded verification artifacts).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('handbook','faq','policy','course_catalog','academic_calendar','services','about')),
  category TEXT,
  url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_kb_documents_source ON public.kb_documents(source);
CREATE INDEX idx_kb_documents_category ON public.kb_documents(category);

CREATE TABLE public.kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.kb_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  embedding vector(1024),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_kb_chunks_doc ON public.kb_chunks(document_id);

-- HNSW index for cosine similarity (built once data is seeded; safe to create empty).
CREATE INDEX idx_kb_chunks_embedding ON public.kb_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Vector search RPC — returns top-k chunks with parent doc context.
CREATE OR REPLACE FUNCTION public.match_kb_chunks(
  query_embedding vector(1024),
  match_count INTEGER DEFAULT 8,
  filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  document_slug TEXT,
  document_title TEXT,
  document_source TEXT,
  document_url TEXT,
  chunk_index INTEGER,
  content TEXT,
  similarity REAL
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id            AS chunk_id,
    d.id            AS document_id,
    d.slug          AS document_slug,
    d.title         AS document_title,
    d.source        AS document_source,
    d.url           AS document_url,
    c.chunk_index,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.kb_chunks c
  JOIN public.kb_documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND (filter_source IS NULL OR d.source = filter_source)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_kb_chunks(vector, INTEGER, TEXT) TO authenticated, anon, service_role;

-- RLS: read-only for chatbot retrieval; writes via service role.
ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_chunks    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read" ON public.kb_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.kb_chunks    FOR SELECT TO authenticated USING (true);
