
-- Add scheduling and quiz mode columns to assessments
ALTER TABLE public.assessments ADD COLUMN schedule_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.assessments ADD COLUMN schedule_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.assessments ADD COLUMN is_online_quiz BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.assessments ADD COLUMN is_marks_finalized BOOLEAN NOT NULL DEFAULT false;

-- Quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  marks INTEGER NOT NULL DEFAULT 1,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quiz responses from students
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, student_id, question_id)
);

-- Quiz attempt tracker (to know if student completed the quiz)
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC(6,2),
  total_marks INTEGER,
  UNIQUE(assessment_id, student_id)
);

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz questions: teachers can CRUD their own, students can read during schedule
CREATE POLICY "Teachers can manage their quiz questions"
  ON public.quiz_questions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = quiz_questions.assessment_id
    AND assessments.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = quiz_questions.assessment_id
    AND assessments.teacher_id = auth.uid()
  ));

CREATE POLICY "Students can view quiz questions during schedule"
  ON public.quiz_questions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = quiz_questions.assessment_id
    AND assessments.is_online_quiz = true
    AND assessments.schedule_start <= now()
    AND assessments.schedule_end >= now()
  ));

-- Quiz responses: students can insert their own, teachers can view all for their assessments
CREATE POLICY "Students can submit their responses"
  ON public.quiz_responses FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = quiz_responses.assessment_id
      AND assessments.is_online_quiz = true
      AND assessments.schedule_start <= now()
      AND assessments.schedule_end >= now()
    )
  );

CREATE POLICY "Students can view their own responses"
  ON public.quiz_responses FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view responses for their assessments"
  ON public.quiz_responses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = quiz_responses.assessment_id
    AND assessments.teacher_id = auth.uid()
  ));

-- Quiz attempts: students can manage their own, teachers can view
CREATE POLICY "Students can manage their attempts"
  ON public.quiz_attempts FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view attempts for their assessments"
  ON public.quiz_attempts FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = quiz_attempts.assessment_id
    AND assessments.teacher_id = auth.uid()
  ));
