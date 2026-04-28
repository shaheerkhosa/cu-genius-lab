-- Create the documents storage bucket. The RLS policies in
-- 20251201204150_… were created assuming this bucket existed, but the
-- bucket itself was never inserted, so all client uploads to the
-- `documents` bucket failed with "Bucket not found".
--
-- Files are namespaced by auth.uid() in the first folder segment
-- (DocumentUploader.tsx writes to `${user.id}/${ts}.ext`), and the
-- existing policies enforce that, so we keep the bucket private.
-- Idempotent — safe to re-run.

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
