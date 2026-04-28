-- Admin can fully manage the timetable; the rest of the policies (students
-- view, teachers manage their own) stay as-is. We also expose a server-side
-- function to detect scheduling conflicts: for a proposed slot, return the
-- list of (student, conflicting other course slot) pairs where a student is
-- enrolled in BOTH the new slot's course AND another course whose existing
-- slot overlaps with it on the same weekday.

BEGIN;

-- ─── RLS for admin ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins manage timetable" ON public.timetable;
CREATE POLICY "Admins manage timetable"
  ON public.timetable
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ─── Conflict detection ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.find_timetable_conflicts(
  p_course_code  TEXT,
  p_day_of_week  INTEGER,
  p_start_time   TIME,
  p_end_time     TIME,
  p_exclude_id   UUID DEFAULT NULL
)
RETURNS TABLE (
  student_id              UUID,
  student_name            TEXT,
  student_email           TEXT,
  conflicting_course_code TEXT,
  conflicting_course_name TEXT,
  conflicting_start       TIME,
  conflicting_end         TIME,
  conflicting_room        TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- "students taking two of the same courses at the same time" — ie. students
  -- who would have a clash between the proposed slot and another slot they
  -- already need to attend. Joins through course_enrollments so we only
  -- consider real students, not the demo seed.
  SELECT DISTINCT
    p.id                    AS student_id,
    COALESCE(p.username, '') AS student_name,
    p.email                 AS student_email,
    other.course_code       AS conflicting_course_code,
    other.course_name       AS conflicting_course_name,
    other.start_time        AS conflicting_start,
    other.end_time          AS conflicting_end,
    other.room              AS conflicting_room
  FROM public.course_enrollments e_proposed
  JOIN public.course_enrollments e_other
    ON e_other.student_id  = e_proposed.student_id
   AND e_other.course_code <> e_proposed.course_code
  JOIN public.timetable other
    ON other.course_code  = e_other.course_code
   AND other.day_of_week  = p_day_of_week
   AND other.start_time   < p_end_time
   AND other.end_time     > p_start_time
   AND (p_exclude_id IS NULL OR other.id <> p_exclude_id)
  JOIN public.profiles p
    ON p.id = e_proposed.student_id
  WHERE e_proposed.course_code = p_course_code
  ORDER BY student_name NULLS LAST, conflicting_course_code;
$$;

-- Limit who can call it. Admins always; teachers can also use it (they may
-- want to know about conflicts for their own course slots).
REVOKE ALL ON FUNCTION public.find_timetable_conflicts(TEXT, INTEGER, TIME, TIME, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_timetable_conflicts(TEXT, INTEGER, TIME, TIME, UUID) TO authenticated;

COMMIT;
