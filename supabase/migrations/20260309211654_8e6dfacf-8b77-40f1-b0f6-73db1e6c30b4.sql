
-- Update handle_new_user to also auto-assign role based on portal_type metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.profiles (id, username, email)
  values (new.id, new.raw_user_meta_data->>'username', new.email);
  
  -- Auto-assign role based on portal selection during signup
  insert into public.user_roles (user_id, role)
  values (new.id, 
    case when new.raw_user_meta_data->>'portal_type' = 'teacher' then 'teacher' else 'user' end
  );
  
  return new;
end;
$$;
