
-- Add file_path to assessments (teacher's uploaded PDF)
ALTER TABLE public.assessments ADD COLUMN file_path TEXT;

-- Add submission_file_path to student_marks (student's uploaded submission)
ALTER TABLE public.student_marks ADD COLUMN submission_file_path TEXT;

-- Create storage bucket for assessment files
INSERT INTO storage.buckets (id, name, public) VALUES ('assessments', 'assessments', true);

-- Storage policies: teachers can upload to their own folder
CREATE POLICY "Teachers can upload assessment files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assessments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Teachers can view assessment files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assessments');

CREATE POLICY "Teachers can delete their assessment files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'assessments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Students can upload submissions to a submissions subfolder
CREATE POLICY "Students can upload submissions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assessments' AND (storage.foldername(name))[1] = 'submissions');

CREATE POLICY "Students can view their submissions"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assessments' AND (storage.foldername(name))[1] = 'submissions');
