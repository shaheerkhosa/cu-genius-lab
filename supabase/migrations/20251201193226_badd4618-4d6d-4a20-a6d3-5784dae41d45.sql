-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy with explicit anonymous access prevention
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id);