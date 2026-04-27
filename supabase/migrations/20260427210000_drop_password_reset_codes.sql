-- Reverts 20260427180000_password_reset_codes.sql.
--
-- We dropped the custom Resend-backed reset flow in favor of Supabase Auth's
-- built-in OTP recovery (which works on web + iOS without needing a verified
-- third-party domain), so the staging table for our own codes is no longer
-- needed.

DROP TABLE IF EXISTS public.password_reset_codes;
