
-- Course enrollments table to track which students are in which courses
CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  course_code text NOT NULL,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_code)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Teachers can view enrollments for their courses (via assessments)
CREATE POLICY "Teachers can view enrollments" ON public.course_enrollments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments
      WHERE assessments.course_code = course_enrollments.course_code
      AND assessments.teacher_id = auth.uid()
    )
  );

-- Teachers can manage enrollments for their courses
CREATE POLICY "Teachers can insert enrollments" ON public.course_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessments
      WHERE assessments.course_code = course_enrollments.course_code
      AND assessments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete enrollments" ON public.course_enrollments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments
      WHERE assessments.course_code = course_enrollments.course_code
      AND assessments.teacher_id = auth.uid()
    )
  );

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" ON public.course_enrollments
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

-- Update assessments SELECT policy to allow enrolled students to see assessments for their courses
CREATE POLICY "Students can view assessments for enrolled courses" ON public.assessments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_code = assessments.course_code
      AND course_enrollments.student_id = auth.uid()
    )
  );
