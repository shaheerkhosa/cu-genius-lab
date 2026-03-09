
-- Drop RLS policies on timetable
DROP POLICY IF EXISTS "Teachers can manage their timetable" ON public.timetable;
DROP POLICY IF EXISTS "Students can view timetable for enrolled courses" ON public.timetable;

-- Remove teacher_id constraint, make it optional for admin-managed slots
ALTER TABLE public.timetable ALTER COLUMN teacher_id DROP NOT NULL;

-- Everyone authenticated can view timetable (filtered in app)
CREATE POLICY "Authenticated users can view timetable"
  ON public.timetable FOR SELECT TO authenticated
  USING (true);

-- Only admins can manage (for now we seed data, admin CRUD comes later)
