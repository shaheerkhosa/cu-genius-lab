
-- Teacher-course mapping table
CREATE TABLE public.teacher_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  course_code text NOT NULL,
  course_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, course_code)
);

ALTER TABLE public.teacher_courses ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own course assignments
CREATE POLICY "Teachers can view their courses"
  ON public.teacher_courses FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id);

-- Students can view teacher-course mappings for enrolled courses (needed for timetable context)
CREATE POLICY "Students can view teacher courses for enrolled courses"
  ON public.teacher_courses FOR SELECT
  TO authenticated
  USING (
    public.is_enrolled_in_course(auth.uid(), course_code)
  );
