-- Course-scoped announcements. Teachers post per course; students see
-- announcements for courses they are enrolled in.

BEGIN;

CREATE TABLE IF NOT EXISTS public.course_announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL,
  teacher_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'normal'
              CHECK (priority IN ('normal', 'important', 'urgent')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_announcements_course_idx
  ON public.course_announcements (course_code, created_at DESC);

CREATE INDEX IF NOT EXISTS course_announcements_teacher_idx
  ON public.course_announcements (teacher_id, created_at DESC);

-- updated_at autobump trigger
CREATE OR REPLACE FUNCTION public.touch_course_announcements_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_announcements_touch ON public.course_announcements;
CREATE TRIGGER trg_course_announcements_touch
  BEFORE UPDATE ON public.course_announcements
  FOR EACH ROW EXECUTE FUNCTION public.touch_course_announcements_updated_at();

ALTER TABLE public.course_announcements ENABLE ROW LEVEL SECURITY;

-- Teacher: full CRUD on their own announcements, scoped to courses they teach.
CREATE POLICY "Teachers manage their announcements"
  ON public.course_announcements
  FOR ALL
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.teacher_courses tc
      WHERE tc.teacher_id = auth.uid()
        AND tc.course_code = course_announcements.course_code
    )
  )
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.teacher_courses tc
      WHERE tc.teacher_id = auth.uid()
        AND tc.course_code = course_announcements.course_code
    )
  );

-- Student: read-only on announcements for courses they are enrolled in.
CREATE POLICY "Students view announcements for enrolled courses"
  ON public.course_announcements
  FOR SELECT
  TO authenticated
  USING (public.is_enrolled_in_course(auth.uid(), course_code));

COMMIT;
