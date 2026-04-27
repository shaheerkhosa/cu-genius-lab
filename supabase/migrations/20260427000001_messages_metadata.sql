-- Add metadata JSONB to messages for citation tracking from the RAG agent.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
