-- Demo seed for shaheerkhosa6@gmail.com.
--
-- Idempotent: re-running wipes the demo student's prior course/attendance/
-- assessment data and reseeds it. Safe to run repeatedly. If the student's
-- auth user doesn't exist yet (they haven't signed up), the migration logs a
-- notice and exits without touching anything else.

DO $$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID := 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0';
  v_student_name TEXT;
  v_student_roll TEXT;

  -- Stable assessment IDs so re-runs don't duplicate quiz_questions etc.
  v_a_studio_due UUID    := '11111111-1111-1111-1111-111111111101';
  v_a_studio_subm UUID   := '11111111-1111-1111-1111-111111111102';
  v_a_studio_graded UUID := '11111111-1111-1111-1111-111111111103';
  v_a_tech_due UUID      := '22222222-2222-2222-2222-222222222201';
  v_a_tech_overdue UUID  := '22222222-2222-2222-2222-222222222202';
  v_a_tech_graded UUID   := '22222222-2222-2222-2222-222222222203';
  v_a_drawing_due UUID   := '33333333-3333-3333-3333-333333333301';
  v_a_drawing_graded UUID:= '33333333-3333-3333-3333-333333333302';
  v_a_intern_subm UUID   := '44444444-4444-4444-4444-444444444401';
  v_q_studio_quiz UUID   := '55555555-5555-5555-5555-555555555501';
  v_q_tech_quiz UUID     := '55555555-5555-5555-5555-555555555502';

  v_today DATE := CURRENT_DATE;
BEGIN
  -- ─── Locate the student ──────────────────────────────────────────────────
  SELECT id INTO v_student_id
  FROM auth.users
  WHERE lower(email) = 'shaheerkhosa6@gmail.com'
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE NOTICE 'Demo student shaheerkhosa6@gmail.com not found in auth.users — skipping seed.';
    RETURN;
  END IF;

  SELECT COALESCE(username, 'Shaheer Khosa') INTO v_student_name
  FROM public.profiles WHERE id = v_student_id;
  v_student_name := COALESCE(v_student_name, 'Shaheer Khosa');
  v_student_roll := 'SP25-DES-001';

  -- ─── Demo teacher (placeholder so assessments.teacher_id FK is satisfied) ─
  -- No real password — this account exists only to satisfy the FK on
  -- assessments.teacher_id and timetable.teacher_id. The empty
  -- encrypted_password ensures it can't actually log in.
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', v_teacher_id, 'authenticated', 'authenticated',
    'demo-teacher@cuonline.local',
    '', now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"Anwar Ali","portal_type":"teacher"}'::jsonb,
    false, false, false
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, email, username)
  VALUES (v_teacher_id, 'demo-teacher@cuonline.local', 'Anwar Ali')
  ON CONFLICT (id) DO NOTHING;

  -- ─── Courses ─────────────────────────────────────────────────────────────
  INSERT INTO public.courses (course_code, course_name, credits, department, semester_number) VALUES
    ('DES301', 'Design Studio III',       3, 'Design', 5),
    ('DES302', 'Design Technologies III', 3, 'Design', 5),
    ('DES303', 'Drawing Studio III',      2, 'Design', 5),
    ('DES304', 'Internship',              3, 'Design', 5)
  ON CONFLICT (course_code) DO UPDATE
    SET course_name = EXCLUDED.course_name,
        credits = EXCLUDED.credits,
        department = EXCLUDED.department,
        semester_number = EXCLUDED.semester_number;

  -- ─── Wipe prior demo data for this student ───────────────────────────────
  DELETE FROM public.quiz_responses WHERE student_id = v_student_id;
  DELETE FROM public.quiz_attempts  WHERE student_id = v_student_id;
  DELETE FROM public.attendance     WHERE student_id = v_student_id;
  DELETE FROM public.student_marks  WHERE student_id = v_student_id OR student_roll_number = v_student_roll;
  DELETE FROM public.course_enrollments WHERE student_id = v_student_id;

  -- Wipe demo assessments + quiz questions (referenced by stable IDs above)
  -- so we can reseed them cleanly.
  DELETE FROM public.quiz_questions WHERE assessment_id IN (
    v_a_studio_due, v_a_studio_subm, v_a_studio_graded,
    v_a_tech_due, v_a_tech_overdue, v_a_tech_graded,
    v_a_drawing_due, v_a_drawing_graded, v_a_intern_subm,
    v_q_studio_quiz, v_q_tech_quiz
  );
  DELETE FROM public.assessments WHERE id IN (
    v_a_studio_due, v_a_studio_subm, v_a_studio_graded,
    v_a_tech_due, v_a_tech_overdue, v_a_tech_graded,
    v_a_drawing_due, v_a_drawing_graded, v_a_intern_subm,
    v_q_studio_quiz, v_q_tech_quiz
  );

  -- Wipe demo timetable for these courses (no stable IDs — wipe by course)
  DELETE FROM public.timetable WHERE course_code IN ('DES301','DES302','DES303','DES304');

  -- ─── Enrollments ─────────────────────────────────────────────────────────
  INSERT INTO public.course_enrollments (student_id, course_code) VALUES
    (v_student_id, 'DES301'),
    (v_student_id, 'DES302'),
    (v_student_id, 'DES303'),
    (v_student_id, 'DES304');

  -- ─── Timetable (Mon–Fri, 9–4) ────────────────────────────────────────────
  INSERT INTO public.timetable (course_code, course_name, teacher_id, day_of_week, start_time, end_time, room) VALUES
    -- Monday
    ('DES301', 'Design Studio III',       v_teacher_id, 1, '09:00', '11:00', 'Room 301'),
    ('DES302', 'Design Technologies III', v_teacher_id, 1, '13:00', '15:00', 'Room 302'),
    -- Tuesday
    ('DES303', 'Drawing Studio III',      v_teacher_id, 2, '10:00', '12:00', 'Studio A'),
    ('DES301', 'Design Studio III',       v_teacher_id, 2, '14:00', '16:00', 'Room 301'),
    -- Wednesday
    ('DES302', 'Design Technologies III', v_teacher_id, 3, '09:00', '11:00', 'Room 302'),
    ('DES304', 'Internship',              v_teacher_id, 3, '13:00', '14:00', 'Online'),
    -- Thursday
    ('DES303', 'Drawing Studio III',      v_teacher_id, 4, '09:00', '11:00', 'Studio A'),
    ('DES301', 'Design Studio III',       v_teacher_id, 4, '13:00', '15:00', 'Room 301'),
    -- Friday
    ('DES302', 'Design Technologies III', v_teacher_id, 5, '10:00', '12:00', 'Room 302'),
    ('DES304', 'Internship',              v_teacher_id, 5, '14:00', '15:00', 'Online');

  -- ─── Attendance (last ~6 weeks, mostly present, a few absent/late) ──────
  -- We seed one attendance row per (course, weekday-class) per week going back.
  WITH dates AS (
    SELECT generate_series(v_today - INTERVAL '42 days', v_today - INTERVAL '1 day', '1 day')::date AS d
  ), classes AS (
    SELECT d, course_code,
           CASE
             -- Two absences and one late spread across the period for color.
             WHEN d = v_today - INTERVAL '11 days' AND course_code = 'DES301' THEN 'absent'
             WHEN d = v_today - INTERVAL '24 days' AND course_code = 'DES302' THEN 'absent'
             WHEN d = v_today - INTERVAL '4 days'  AND course_code = 'DES303' THEN 'late'
             ELSE 'present'
           END AS status
    FROM dates, (VALUES ('DES301',1),('DES301',2),('DES301',4),
                        ('DES302',1),('DES302',3),('DES302',5),
                        ('DES303',2),('DES303',4),
                        ('DES304',3),('DES304',5)) AS slots(course_code, dow)
    WHERE EXTRACT(DOW FROM d)::int = slots.dow
  )
  INSERT INTO public.attendance (student_id, teacher_id, course_code, date, status)
  SELECT v_student_id, v_teacher_id, course_code, d, status FROM classes
  ON CONFLICT (course_code, student_id, date) DO NOTHING;

  -- ─── Assessments ─────────────────────────────────────────────────────────
  -- Design Studio III: one due, one submitted (pending grade), one graded
  INSERT INTO public.assessments (id, teacher_id, course_code, course_name, assessment_type, title, total_marks, is_online_quiz, schedule_start, schedule_end, is_marks_finalized) VALUES
    (v_a_studio_due,    v_teacher_id, 'DES301', 'Design Studio III', 'assignment', 'Newspaper Design — Urdu',  100, false, v_today - 7,  v_today + 5,  false),
    (v_a_studio_subm,   v_teacher_id, 'DES301', 'Design Studio III', 'assignment', '3 Compositions Set',       100, false, v_today - 21, v_today - 4,  false),
    (v_a_studio_graded, v_teacher_id, 'DES301', 'Design Studio III', 'assignment', 'Monogram Pack',            100, false, v_today - 35, v_today - 18, true),

  -- Design Technologies III: one due, one overdue (no submission), one graded
    (v_a_tech_due,      v_teacher_id, 'DES302', 'Design Technologies III', 'assignment', 'UI/UX Design Deliverable', 100, false, v_today - 3,  v_today + 7,  false),
    (v_a_tech_overdue,  v_teacher_id, 'DES302', 'Design Technologies III', 'assignment', 'Book Design Mockup',       100, false, v_today - 28, v_today - 6,  false),
    (v_a_tech_graded,   v_teacher_id, 'DES302', 'Design Technologies III', 'midterm',    'Midterm Project',          100, false, v_today - 40, v_today - 21, true),

  -- Drawing Studio III: due + graded
    (v_a_drawing_due,    v_teacher_id, 'DES303', 'Drawing Studio III', 'assignment', 'Digital Painting Study', 100, false, v_today - 5,  v_today + 9,  false),
    (v_a_drawing_graded, v_teacher_id, 'DES303', 'Drawing Studio III', 'assignment', 'Charcoal Series',        100, false, v_today - 30, v_today - 14, true),

  -- Internship: one submitted (waiting on supervisor)
    (v_a_intern_subm,    v_teacher_id, 'DES304', 'Internship', 'assignment', 'Internship Certificate Upload', 100, false, v_today - 14, v_today - 1,  false),

  -- Online quizzes (one per the two main courses)
    (v_q_studio_quiz,    v_teacher_id, 'DES301', 'Design Studio III',       'quiz', 'Design Quiz I',  20, true, v_today - 14, v_today - 13, true),
    (v_q_tech_quiz,      v_teacher_id, 'DES302', 'Design Technologies III', 'quiz', 'Tech Quiz I',    20, true, v_today + 1,  v_today + 2,  false);

  -- ─── Student marks (submissions + grades) ───────────────────────────────
  INSERT INTO public.student_marks (assessment_id, student_id, student_name, student_roll_number, marks_obtained, submission_file_path, remarks) VALUES
    -- Submitted but not yet graded (marks_obtained NULL)
    (v_a_studio_subm,  v_student_id, v_student_name, v_student_roll, NULL,  'submissions/' || v_student_id || '/3-compositions.pdf', NULL),
    (v_a_intern_subm,  v_student_id, v_student_name, v_student_roll, NULL,  'submissions/' || v_student_id || '/internship-cert.pdf', NULL),
    -- Graded
    (v_a_studio_graded,  v_student_id, v_student_name, v_student_roll, 86,   'submissions/' || v_student_id || '/monograms.pdf', 'Strong concept work, refine the mark hierarchy.'),
    (v_a_tech_graded,    v_student_id, v_student_name, v_student_roll, 78,   'submissions/' || v_student_id || '/midterm.pdf',   'Solid execution; revisit the type pairing on slide 3.'),
    (v_a_drawing_graded, v_student_id, v_student_name, v_student_roll, 91,   'submissions/' || v_student_id || '/charcoal.pdf',  'Great range of values.');

  -- ─── Quiz questions for Design Quiz I (DES301) ───────────────────────────
  INSERT INTO public.quiz_questions (assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order) VALUES
    (v_q_studio_quiz, 'Which design principle describes equal visual weight on either side of a composition?',
      'Hierarchy', 'Balance', 'Contrast', 'Rhythm', 'b', 4, 1),
    (v_q_studio_quiz, 'In Gestalt theory, elements that move together are perceived as related. This is the law of:',
      'Proximity', 'Similarity', 'Common fate', 'Closure', 'c', 4, 2),
    (v_q_studio_quiz, 'Which of these is NOT a primary subtractive colour?',
      'Cyan', 'Magenta', 'Yellow', 'Green', 'd', 4, 3),
    (v_q_studio_quiz, 'A grid that varies column widths to suit the content is called:',
      'Modular grid', 'Manuscript grid', 'Hierarchical grid', 'Column grid', 'c', 4, 4),
    (v_q_studio_quiz, 'Kerning refers to:',
      'Adjusting space between two specific letters',
      'The overall letter spacing of a block of text',
      'The space between lines',
      'The size relationship of headlines and body',
      'a', 4, 5);

  -- The student already attempted Design Quiz I and scored 16/20.
  INSERT INTO public.quiz_attempts (assessment_id, student_id, started_at, completed_at, score, total_marks)
  VALUES (v_q_studio_quiz, v_student_id, v_today - 14, v_today - 14, 16, 20);

  INSERT INTO public.quiz_responses (assessment_id, student_id, question_id, selected_option, is_correct)
  SELECT v_q_studio_quiz, v_student_id, q.id,
         CASE q.question_order WHEN 3 THEN 'a' ELSE q.correct_option END AS selected,
         CASE q.question_order WHEN 3 THEN false ELSE true END
  FROM public.quiz_questions q
  WHERE q.assessment_id = v_q_studio_quiz;

  -- ─── Quiz questions for Tech Quiz I (DES302), upcoming ───────────────────
  INSERT INTO public.quiz_questions (assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order) VALUES
    (v_q_tech_quiz, 'Which Figma feature creates a reusable design token?',
      'Auto-layout', 'Variants', 'Variables', 'Constraints', 'c', 4, 1),
    (v_q_tech_quiz, 'In a mobile UI, the recommended minimum tap target size is approximately:',
      '24×24 pt', '32×32 pt', '44×44 pt', '64×64 pt', 'c', 4, 2),
    (v_q_tech_quiz, 'WCAG AA contrast requires a minimum ratio of:',
      '3:1', '4.5:1', '7:1', '10:1', 'b', 4, 3),
    (v_q_tech_quiz, 'A "lo-fi" prototype is best characterised as:',
      'Pixel-perfect with brand colours',
      'Quick, sketch-quality screens for early feedback',
      'A motion-rich animated demo',
      'Production-ready for engineering hand-off',
      'b', 4, 4),
    (v_q_tech_quiz, 'What does CTA stand for in product design?',
      'Content Type Annotation',
      'Critical Task Analysis',
      'Call To Action',
      'Component Tree Architecture',
      'c', 4, 5);

  -- ─── Make sure the student has the right role (in case they signed up
  --     before the trigger that auto-creates user_roles) ─────────────────────
  INSERT INTO public.user_roles (user_id, role)
  SELECT v_student_id, 'user'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_student_id
  );

  RAISE NOTICE 'Demo seed complete for student %', v_student_id;
END $$;
