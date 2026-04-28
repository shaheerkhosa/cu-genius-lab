-- Seed (or repair) the admin@cuonline.local account so the admin portal
-- can be demoed. Login: admin@cuonline.local / admin1234
--
-- This migration is robust to two starting states:
--   1. The user does not exist yet — we create them with a fresh UUID.
--   2. The user exists but has the wrong password / no admin role row —
--      we look them up by email and update everything to match.
--
-- Idempotent: re-running rotates the password (so editing this file
-- changes the live password) and ensures the admin role exists.

DO $$
DECLARE
  v_admin_id UUID;
  v_admin_email TEXT := 'admin@cuonline.local';
  v_admin_password TEXT := 'admin1234';
BEGIN
  -- 1. Find an existing admin user by email; otherwise mint a new UUID.
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE lower(email) = v_admin_email
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user, is_anonymous
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated', 'authenticated',
      v_admin_email,
      extensions.crypt(v_admin_password, extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"Administrator","portal_type":"admin"}'::jsonb,
      false, false, false
    );
  ELSE
    -- Reset the password and ensure the account is confirmed so login works.
    UPDATE auth.users
       SET encrypted_password = extensions.crypt(v_admin_password, extensions.gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
                              || '{"username":"Administrator","portal_type":"admin"}'::jsonb,
           raw_app_meta_data  = COALESCE(raw_app_meta_data, '{}'::jsonb)
                              || '{"provider":"email","providers":["email"]}'::jsonb,
           updated_at = now()
     WHERE id = v_admin_id;
  END IF;

  -- 2. Ensure an email identity row exists (Supabase auth >= 2024 requires
  --    one for password sign-in to work).
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', v_admin_email, 'email_verified', true),
    'email',
    v_admin_id::text,
    now(), now(), now()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE
    SET identity_data = EXCLUDED.identity_data,
        updated_at    = now();

  -- 3. Profile row for public-facing data.
  INSERT INTO public.profiles (id, email, username)
  VALUES (v_admin_id, v_admin_email, 'Administrator')
  ON CONFLICT (id) DO UPDATE
    SET email    = EXCLUDED.email,
        username = EXCLUDED.username;

  -- 4. Admin role. The user_roles table is what useUserRole() reads to
  --    decide whether to redirect to /admin, so without this row the
  --    login silently lands on the student home.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Strip any non-admin role rows the user might have collected (e.g. an
  -- automatic 'user' row from the signup trigger), so the role lookup is
  -- unambiguous.
  DELETE FROM public.user_roles
  WHERE user_id = v_admin_id
    AND role <> 'admin';

  RAISE NOTICE 'Admin account ready: % (id %)', v_admin_email, v_admin_id;
END $$;
