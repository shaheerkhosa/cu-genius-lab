
-- Assessments table: stores quizzes, assignments, midterms, finals created by teachers
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'assignment', 'midterm', 'final')),
  title TEXT NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student marks table: stores individual student marks per assessment
CREATE TABLE public.student_marks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_roll_number TEXT NOT NULL,
  marks_obtained NUMERIC(6,2),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, student_roll_number)
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;

-- Assessments: teachers can CRUD their own assessments
CREATE POLICY "Teachers can view their own assessments"
  ON public.assessments FOR SELECT TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create assessments"
  ON public.assessments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own assessments"
  ON public.assessments FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own assessments"
  ON public.assessments FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id);

-- Student marks: teachers can CRUD marks for their assessments
CREATE POLICY "Teachers can view marks for their assessments"
  ON public.student_marks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = student_marks.assessment_id
    AND assessments.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers can insert marks for their assessments"
  ON public.student_marks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = student_marks.assessment_id
    AND assessments.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers can update marks for their assessments"
  ON public.student_marks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = student_marks.assessment_id
    AND assessments.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers can delete marks for their assessments"
  ON public.student_marks FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = student_marks.assessment_id
    AND assessments.teacher_id = auth.uid()
  ));
