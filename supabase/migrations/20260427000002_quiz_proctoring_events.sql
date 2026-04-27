-- Anti-cheat proctoring events captured during online quiz attempts.
-- Uses webcam + browser signals (no face / multiple faces / head turn / tab blur).

CREATE TABLE public.quiz_proctoring_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('no_face', 'multiple_faces', 'head_turned', 'tab_blur', 'permission_denied', 'auto_submit')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_quiz_proctoring_events_assessment_student
  ON public.quiz_proctoring_events(assessment_id, student_id, created_at);

ALTER TABLE public.quiz_proctoring_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert their own proctoring events"
  ON public.quiz_proctoring_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own proctoring events"
  ON public.quiz_proctoring_events FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view proctoring events for their assessments"
  ON public.quiz_proctoring_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = quiz_proctoring_events.assessment_id
    AND assessments.teacher_id = auth.uid()
  ));
