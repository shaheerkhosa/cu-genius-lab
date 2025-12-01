-- Add RLS policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins need a security definer function to manage roles
-- For now, only allow viewing own roles (admin management can be added later via security definer functions)

-- Add RLS policies for notifications table
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);