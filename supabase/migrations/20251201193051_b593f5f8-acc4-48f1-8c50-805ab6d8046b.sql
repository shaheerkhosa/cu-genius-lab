-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restrictive SELECT policy
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);