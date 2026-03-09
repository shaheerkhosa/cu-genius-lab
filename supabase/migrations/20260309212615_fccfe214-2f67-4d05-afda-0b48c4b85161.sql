
-- Add student_id column to student_marks to link marks to authenticated students
ALTER TABLE public.student_marks ADD COLUMN IF NOT EXISTS student_id uuid;

-- Add RLS policy so students can view their own marks
CREATE POLICY "Students can view their own marks"
  ON public.student_marks FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Allow teachers to look up student profiles by email (for enrollment)
CREATE POLICY "Teachers can view student profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'teacher'
    )
  );

-- Drop the old restrictive profile select policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
