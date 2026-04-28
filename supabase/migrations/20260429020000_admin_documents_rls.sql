-- Give admins full visibility into the document review queue.
--
-- Until now, public.documents only had per-user RLS policies (auth.uid() =
-- user_id), which meant admins could only see documents they had uploaded
-- themselves. The Admin Document Queue page therefore always showed zero
-- documents regardless of how many students had submitted. Same problem
-- on UPDATE — admins couldn't approve / reject without becoming the
-- document's owner.
--
-- We piggy-back on the existing public.is_admin(_user_id uuid) helper
-- (SECURITY DEFINER, bypasses RLS on user_roles) so policies stay simple.
--
-- Idempotent.

-- documents — admin SELECT
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- documents — admin UPDATE (so they can flip verification_status,
-- reviewed_by, reviewed_at, admin_notes)
DROP POLICY IF EXISTS "Admins can update any document" ON public.documents;
CREATE POLICY "Admins can update any document"
ON public.documents
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- notifications — admin INSERT (handleAction in AdminDocumentQueue writes
-- a notification row to the affected student; without this it silently
-- fails RLS).
DROP POLICY IF EXISTS "Admins can insert notifications for any user" ON public.notifications;
CREATE POLICY "Admins can insert notifications for any user"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));
