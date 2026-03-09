
-- Drop the recursive policy causing infinite recursion
DROP POLICY IF EXISTS "Students can view assessments for enrolled courses" ON public.assessments;

-- Recreate without referencing course_enrollments from assessments
-- Instead, use a security definer function to break the recursion
CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(_student_id uuid, _course_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE student_id = _student_id
      AND course_code = _course_code
  )
$$;

-- Now create the policy using the function (no recursion)
CREATE POLICY "Students can view assessments for enrolled courses" ON public.assessments
  FOR SELECT TO authenticated
  USING (public.is_enrolled_in_course(auth.uid(), course_code));
