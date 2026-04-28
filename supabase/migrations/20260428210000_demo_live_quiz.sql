-- Demo: make Tech Quiz I (DES302) a LIVE online quiz so the personal demo
-- accounts can take it and the webcam-based anti-cheat proctoring flow
-- can be demoed.
--
-- Covers TWO demo accounts:
--   1. shaheerkhosa6@gmail.com — original demo seed (migration 20260427230000)
--   2. henry@scaledai.org      — second demo account, gets the same Design
--                                 enrollments, attendance, assessments and
--                                 a fresh live quiz to take.
--
-- The original seed scheduled Tech Quiz I for the day after seed time, which
-- left it permanently un-takeable. We pin it to a 7-day live window starting
-- one hour ago so it's always immediately available.
--
-- Idempotent: re-running refreshes the schedule and re-seeds Henry's data.

DO $$
DECLARE
  v_q_tech_quiz UUID := '55555555-5555-5555-5555-555555555502';
  v_q_studio_quiz UUID := '55555555-5555-5555-5555-555555555501';
  v_teacher_id UUID := 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0';
  v_now TIMESTAMPTZ := now();
  v_today DATE := CURRENT_DATE;
  v_henry_id UUID;
  v_henry_name TEXT;
  v_henry_roll TEXT := 'SP25-DES-002';
BEGIN
  -- ─── Part 1: make Tech Quiz I live (affects all enrolled students) ──────
  IF EXISTS (SELECT 1 FROM public.assessments WHERE id = v_q_tech_quiz) THEN
    UPDATE public.assessments
       SET schedule_start = v_now - INTERVAL '1 hour',
           schedule_end   = v_now + INTERVAL '7 days',
           is_online_quiz = true,
           is_marks_finalized = false
     WHERE id = v_q_tech_quiz;

    -- Wipe prior attempts/marks/proctoring on this quiz so demo runs fresh
    DELETE FROM public.quiz_responses WHERE assessment_id = v_q_tech_quiz;
    DELETE FROM public.quiz_attempts  WHERE assessment_id = v_q_tech_quiz;
    DELETE FROM public.student_marks  WHERE assessment_id = v_q_tech_quiz;
    DELETE FROM public.quiz_proctoring_events WHERE assessment_id = v_q_tech_quiz;

    RAISE NOTICE 'Tech Quiz I is now live for 7 days from %', v_now;
  ELSE
    RAISE NOTICE 'Tech Quiz I not found — personal demo seed has not been applied. Skipping Part 1.';
  END IF;

  -- ─── Part 2: enroll henry@scaledai.org in the same demo design courses ──
  SELECT id INTO v_henry_id
  FROM auth.users
  WHERE lower(email) = 'henry@scaledai.org'
  LIMIT 1;

  IF v_henry_id IS NULL THEN
    RAISE NOTICE 'henry@scaledai.org not found in auth.users — skipping Part 2.';
    RETURN;
  END IF;

  SELECT COALESCE(username, 'Henry') INTO v_henry_name
  FROM public.profiles WHERE id = v_henry_id;
  v_henry_name := COALESCE(v_henry_name, 'Henry');

  -- Wipe any prior demo data for Henry so this is idempotent
  DELETE FROM public.quiz_responses WHERE student_id = v_henry_id;
  DELETE FROM public.quiz_attempts  WHERE student_id = v_henry_id;
  DELETE FROM public.attendance     WHERE student_id = v_henry_id;
  DELETE FROM public.student_marks  WHERE student_id = v_henry_id OR student_roll_number = v_henry_roll;
  DELETE FROM public.quiz_proctoring_events WHERE student_id = v_henry_id;
  DELETE FROM public.course_enrollments WHERE student_id = v_henry_id AND course_code IN ('DES301','DES302','DES303','DES304');

  -- Enroll in the same 4 design courses as the existing demo
  INSERT INTO public.course_enrollments (student_id, course_code) VALUES
    (v_henry_id, 'DES301'),
    (v_henry_id, 'DES302'),
    (v_henry_id, 'DES303'),
    (v_henry_id, 'DES304')
  ON CONFLICT (student_id, course_code) DO NOTHING;

  -- Seed attendance over last 6 weeks (mostly present, a few absent/late)
  WITH dates AS (
    SELECT generate_series(v_today - INTERVAL '42 days', v_today - INTERVAL '1 day', '1 day')::date AS d
  ), classes AS (
    SELECT d, course_code,
           CASE
             WHEN d = v_today - INTERVAL '8 days'  AND course_code = 'DES301' THEN 'absent'
             WHEN d = v_today - INTERVAL '20 days' AND course_code = 'DES303' THEN 'absent'
             WHEN d = v_today - INTERVAL '3 days'  AND course_code = 'DES302' THEN 'late'
             ELSE 'present'
           END AS status
    FROM dates, (VALUES ('DES301',1),('DES301',2),('DES301',4),
                        ('DES302',1),('DES302',3),('DES302',5),
                        ('DES303',2),('DES303',4),
                        ('DES304',3),('DES304',5)) AS slots(course_code, dow)
    WHERE EXTRACT(DOW FROM d)::int = slots.dow
  )
  INSERT INTO public.attendance (student_id, teacher_id, course_code, date, status)
  SELECT v_henry_id, v_teacher_id, course_code, d, status FROM classes
  ON CONFLICT (course_code, student_id, date) DO NOTHING;

  -- Seed marks: a couple of submitted-not-graded + a couple of graded
  -- (only for the offline assessments — Henry can take Tech Quiz I live)
  INSERT INTO public.student_marks (assessment_id, student_id, student_name, student_roll_number, marks_obtained, submission_file_path, remarks)
  SELECT a.id, v_henry_id, v_henry_name, v_henry_roll,
         CASE
           WHEN a.is_marks_finalized THEN GREATEST(60, LEAST(95, 75 + ((random() * 20 - 10)::int)))
           ELSE NULL
         END,
         'submissions/' || v_henry_id || '/' || a.id || '.pdf',
         CASE WHEN a.is_marks_finalized THEN 'Solid work overall.' ELSE NULL END
  FROM public.assessments a
  WHERE a.id IN (
    '11111111-1111-1111-1111-111111111102',  -- 3 Compositions Set (submitted)
    '11111111-1111-1111-1111-111111111103',  -- Monogram Pack (graded)
    '22222222-2222-2222-2222-222222222203',  -- Midterm Project (graded)
    '33333333-3333-3333-3333-333333333302',  -- Charcoal Series (graded)
    '44444444-4444-4444-4444-444444444401'   -- Internship Cert (submitted)
  )
  ON CONFLICT (assessment_id, student_roll_number) DO NOTHING;

  -- Make sure Henry has a user_role row (in case the auto-trigger missed it)
  INSERT INTO public.user_roles (user_id, role)
  SELECT v_henry_id, 'user'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_henry_id
  );

  -- Optional: pre-record Henry's attempt on the historical Design Quiz I so
  -- his marks page shows a completed quiz for context (16/20, same as Shaheer)
  IF EXISTS (SELECT 1 FROM public.assessments WHERE id = v_q_studio_quiz) THEN
    INSERT INTO public.quiz_attempts (assessment_id, student_id, started_at, completed_at, score, total_marks)
    VALUES (v_q_studio_quiz, v_henry_id, v_today - 14, v_today - 14, 16, 20)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.quiz_responses (assessment_id, student_id, question_id, selected_option, is_correct)
    SELECT v_q_studio_quiz, v_henry_id, q.id,
           CASE q.question_order WHEN 3 THEN 'a' ELSE q.correct_option END,
           CASE q.question_order WHEN 3 THEN false ELSE true END
    FROM public.quiz_questions q
    WHERE q.assessment_id = v_q_studio_quiz
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Demo enrollment + live Tech Quiz I ready for henry@scaledai.org (id %)', v_henry_id;
END $$;
