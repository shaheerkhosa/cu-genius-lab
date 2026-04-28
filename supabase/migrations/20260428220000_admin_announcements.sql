-- Admin-broadcast announcements: a separate channel from the per-course
-- announcements teachers post in `course_announcements`. Admins target
-- either ALL students or a specific batch identified by enrollment year.
--
-- A `profiles.enrollment_year` column is added so we can do the batch match
-- without joining through the seed `students` table (which most signed-up
-- users don't have a row in).

BEGIN;

-- ─── enrollment_year on profiles ──────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS enrollment_year INTEGER NOT NULL
  DEFAULT EXTRACT(YEAR FROM now())::INTEGER;

-- Backfill existing rows defensively (the DEFAULT covers new inserts).
UPDATE public.profiles
SET enrollment_year = EXTRACT(YEAR FROM now())::INTEGER
WHERE enrollment_year IS NULL;

-- Tag the demo student to a different batch so "send to a specific batch"
-- is meaningfully demoable.
UPDATE public.profiles
SET enrollment_year = 2025
WHERE email = 'shaheerkhosa6@gmail.com';

-- ─── student_announcements table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  audience_type   TEXT NOT NULL CHECK (audience_type IN ('all', 'batch')),
  audience_value  INTEGER, -- enrollment_year when audience_type = 'batch', NULL when 'all'
  priority        TEXT NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('normal', 'important', 'urgent')),
  created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_announcements_audience_value_chk CHECK (
    (audience_type = 'all' AND audience_value IS NULL)
    OR (audience_type = 'batch' AND audience_value IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS student_announcements_audience_idx
  ON public.student_announcements (audience_type, audience_value, created_at DESC);

CREATE INDEX IF NOT EXISTS student_announcements_created_idx
  ON public.student_announcements (created_at DESC);

-- updated_at autobump
CREATE OR REPLACE FUNCTION public.touch_student_announcements_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_student_announcements_touch ON public.student_announcements;
CREATE TRIGGER trg_student_announcements_touch
  BEFORE UPDATE ON public.student_announcements
  FOR EACH ROW EXECUTE FUNCTION public.touch_student_announcements_updated_at();

ALTER TABLE public.student_announcements ENABLE ROW LEVEL SECURITY;

-- ─── RLS helpers ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.profile_enrollment_year(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT enrollment_year FROM public.profiles WHERE id = _user_id
$$;

-- ─── RLS policies ────────────────────────────────────────────────────────
-- Admins: full CRUD.
DROP POLICY IF EXISTS "Admins manage student_announcements" ON public.student_announcements;
CREATE POLICY "Admins manage student_announcements"
  ON public.student_announcements
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());

-- Students/teachers: read-only, scoped to 'all' or matching batch.
DROP POLICY IF EXISTS "Audience reads student_announcements" ON public.student_announcements;
CREATE POLICY "Audience reads student_announcements"
  ON public.student_announcements
  FOR SELECT
  TO authenticated
  USING (
    audience_type = 'all'
    OR (
      audience_type = 'batch'
      AND audience_value = public.profile_enrollment_year(auth.uid())
    )
  );

-- ─── grant_admin helper ──────────────────────────────────────────────────
-- One-shot helper for the project owner to elevate any signed-up user to
-- the admin role. Intentionally callable only from the postgres / service
-- role (not authenticated users) to prevent privilege escalation. Run via:
--   SELECT public.grant_admin('your-email@example.com');
-- in the Supabase SQL editor or `supabase db query`.
CREATE OR REPLACE FUNCTION public.grant_admin(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user with email %', p_email;
  END IF;

  -- The unique constraint is (user_id, role); leaves any other role rows
  -- in place so this is non-destructive if the user already has another
  -- role. A user can hold multiple roles in this schema.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_admin(TEXT) FROM authenticated;

COMMIT;
