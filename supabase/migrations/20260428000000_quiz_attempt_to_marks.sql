-- Sync completed online-quiz attempts into student_marks so they appear
-- in the teacher gradebook and the student's Progress page.

CREATE OR REPLACE FUNCTION public.sync_quiz_attempt_to_marks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_profile RECORD;
BEGIN
  -- Only fire when an attempt is completed (completed_at transitions to non-null).
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.completed_at IS NOT NULL THEN
    -- Already completed before; allow score updates to flow through.
    NULL;
  END IF;

  -- Look up the student's profile for name + email-as-roll-number.
  SELECT id, COALESCE(username, email) AS display_name, email
  INTO student_profile
  FROM public.profiles
  WHERE id = NEW.student_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.student_marks (
    assessment_id,
    student_id,
    student_name,
    student_roll_number,
    marks_obtained,
    remarks,
    created_at,
    updated_at
  ) VALUES (
    NEW.assessment_id,
    NEW.student_id,
    student_profile.display_name,
    student_profile.email,
    NEW.score,
    'Auto-graded online quiz',
    now(),
    now()
  )
  ON CONFLICT (assessment_id, student_roll_number) DO UPDATE
  SET marks_obtained = EXCLUDED.marks_obtained,
      student_id = EXCLUDED.student_id,
      remarks = COALESCE(public.student_marks.remarks, EXCLUDED.remarks),
      updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_quiz_attempt_to_marks ON public.quiz_attempts;

CREATE TRIGGER trg_sync_quiz_attempt_to_marks
  AFTER INSERT OR UPDATE OF completed_at, score ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_quiz_attempt_to_marks();
