-- Add SELECT policy to documents table so users can only view their own documents
CREATE POLICY "Users can view their own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add INSERT policy to documents table
CREATE POLICY "Users can insert their own documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for users to update their own documents
CREATE POLICY "Users can update their own documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add DELETE policy for users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON public.documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);