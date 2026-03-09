
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text UNIQUE NOT NULL,
  course_name text NOT NULL,
  credits integer NOT NULL DEFAULT 3,
  department text NOT NULL DEFAULT 'CS',
  semester_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view courses"
  ON public.courses FOR SELECT TO authenticated USING (true);
