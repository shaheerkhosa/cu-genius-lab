
-- Timetable: weekly recurring class slots
CREATE TABLE public.timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL,
  course_name text NOT NULL,
  teacher_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- Teachers manage their own timetable
CREATE POLICY "Teachers can manage their timetable"
  ON public.timetable FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Students can view timetable for their enrolled courses
CREATE POLICY "Students can view timetable for enrolled courses"
  ON public.timetable FOR SELECT TO authenticated
  USING (
    is_enrolled_in_course(auth.uid(), course_code)
  );
