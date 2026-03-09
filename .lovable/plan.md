

## Problem

The `user_roles` table is completely empty. The `handle_new_user()` function exists and correctly inserts roles based on `portal_type` metadata, but **no trigger is attached** to `auth.users` to invoke it. So signup never creates a role, and the Auth page's redirect logic always falls through to the student portal (`/`).

Additionally, the Sir Asim account (`shaheeraurhasankidharhain@gmail.com`) exists in `profiles` but has no role assigned.

## Plan

### 1. Create the missing database trigger + fix existing data
A single migration that:
- Creates the trigger `on_auth_user_created` on `auth.users` AFTER INSERT, calling `handle_new_user()`
- Inserts the missing role for Sir Asim's account (`teacher` role)
- Backfills any other existing users with a default `user` role if they have no role entry

### 2. Fix Auth page redirect race condition
The `onAuthStateChange` callback queries `user_roles` immediately after `SIGNED_IN`, but for new signups the trigger may not have completed yet. Fix:
- After signup, don't auto-login — just show success message (already done)
- In `onAuthStateChange`, add a small retry/delay for role fetch, or handle the case where role is not yet available by defaulting based on user metadata `portal_type`

### 3. Update Auth redirect logic
In the `onAuthStateChange` handler and `getSession` check:
- If `user_roles` returns no data, fall back to `session.user.user_metadata.portal_type` to determine redirect
- This handles the edge case where the trigger hasn't completed yet

### Files to change
- **New migration** — create trigger on `auth.users`, backfill roles
- **`src/pages/Auth.tsx`** — improve redirect logic with metadata fallback

