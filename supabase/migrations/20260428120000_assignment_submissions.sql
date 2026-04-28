-- Student-facing assignment submission flow.
--
-- Adds submitted_at + is_late tracking columns to student_marks and a
-- SECURITY DEFINER RPC that students call to register their uploaded file.
--
-- Why an RPC and not a direct UPDATE? student_marks INSERT/UPDATE RLS is
-- restricted to the assessment's teacher (so a student can't change their own
-- mark). For submissions we need controlled, column-scoped writes that also:
--   - verify the caller is enrolled in the course
--   - verify the assessment is type 'assignment'
--   - flag late submissions automatically
--   - never overwrite an existing graded mark
--   - upsert (create the row on first submission)

BEGIN;

ALTER TABLE public.student_marks
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_late BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.submit_assignment(
  p_assessment_id UUID,
  p_file_path TEXT
)
RETURNS public.student_marks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_assessment RECORD;
  v_profile RECORD;
  v_late BOOLEAN := false;
  v_row public.student_marks;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_file_path IS NULL OR length(trim(p_file_path)) = 0 THEN
    RAISE EXCEPTION 'File path is required' USING ERRCODE = '22023';
  END IF;

  -- Sanity: file must live under the submissions/ prefix that storage RLS allows.
  IF p_file_path NOT LIKE 'submissions/%' THEN
    RAISE EXCEPTION 'Submission must be uploaded to submissions/...' USING ERRCODE = '22023';
  END IF;

  -- Pull the assessment and confirm it accepts submissions.
  SELECT id, course_code, assessment_type, schedule_end, is_marks_finalized
  INTO v_assessment
  FROM public.assessments
  WHERE id = p_assessment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found' USING ERRCODE = '02000';
  END IF;

  IF v_assessment.assessment_type <> 'assignment' THEN
    RAISE EXCEPTION 'Only assignments accept submissions' USING ERRCODE = '22023';
  END IF;

  IF v_assessment.is_marks_finalized THEN
    RAISE EXCEPTION 'Marks are finalized; submissions are closed' USING ERRCODE = '22023';
  END IF;

  -- Caller must be enrolled in the course.
  IF NOT public.is_enrolled_in_course(v_user_id, v_assessment.course_code) THEN
    RAISE EXCEPTION 'Not enrolled in this course' USING ERRCODE = '42501';
  END IF;

  -- Late check (only when a deadline is set).
  IF v_assessment.schedule_end IS NOT NULL AND now() > v_assessment.schedule_end THEN
    v_late := true;
  END IF;

  -- Grab the student's display profile for the gradebook.
  SELECT id, COALESCE(username, email) AS display_name, email
  INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = '02000';
  END IF;

  INSERT INTO public.student_marks (
    assessment_id,
    student_id,
    student_name,
    student_roll_number,
    submission_file_path,
    submitted_at,
    is_late,
    remarks,
    created_at,
    updated_at
  ) VALUES (
    p_assessment_id,
    v_user_id,
    v_profile.display_name,
    v_profile.email,
    p_file_path,
    now(),
    v_late,
    CASE WHEN v_late THEN 'Submitted late' ELSE NULL END,
    now(),
    now()
  )
  ON CONFLICT (assessment_id, student_roll_number) DO UPDATE
  SET submission_file_path = EXCLUDED.submission_file_path,
      submitted_at         = EXCLUDED.submitted_at,
      is_late              = EXCLUDED.is_late,
      student_id           = COALESCE(public.student_marks.student_id, EXCLUDED.student_id),
      student_name         = EXCLUDED.student_name,
      remarks              = CASE
        WHEN public.student_marks.marks_obtained IS NULL
        THEN COALESCE(EXCLUDED.remarks, public.student_marks.remarks)
        ELSE public.student_marks.remarks
      END,
      updated_at           = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_assignment(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_assignment(UUID, TEXT) TO authenticated;

COMMIT;
