
-- Create attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL,
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(course_code, student_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Teachers can manage attendance for their courses
CREATE POLICY "Teachers can insert attendance"
  ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update attendance"
  ON public.attendance FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can view attendance for their courses"
  ON public.attendance FOR SELECT TO authenticated
  USING (
    auth.uid() = teacher_id
    OR auth.uid() = student_id
  );

CREATE POLICY "Teachers can delete attendance"
  ON public.attendance FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id);
