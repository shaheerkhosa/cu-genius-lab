
-- Update check constraint to include 'teacher'
ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role = ANY (ARRAY['admin'::text, 'moderator'::text, 'user'::text, 'teacher'::text]));

-- Backfill: Insert teacher role for Sir Asim
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'teacher'
FROM public.profiles p
WHERE p.email = 'shaheeraurhasankidharhain@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p.id);

-- Backfill: Insert default 'user' role for any other profiles missing a role
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'user'
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL;
