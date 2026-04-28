import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'moderator' | 'teacher' | 'user';

const PRIORITY: UserRole[] = ['admin', 'moderator', 'teacher', 'user'];

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (cancelled) return;
          setRole(null);
          setIsAdmin(false);
          setIsTeacher(false);
          setLoading(false);
          return;
        }

        // A user can hold multiple role rows (the schema's UNIQUE is
        // (user_id, role)); pick the highest-privilege one. Using
        // .maybeSingle() here would error when there's more than one row,
        // which silently demotes admins to "user" — that's the bug we
        // hit before.
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        // Fall back to the portal_type stored in user_metadata when the
        // user_roles query is empty or fails (RLS, missing seed row, etc.).
        // This ensures admins/teachers never get silently demoted to 'user'
        // and stranded on the student portal.
        const fallback = (user.user_metadata?.portal_type as string | undefined);
        const roles: UserRole[] = (data ?? []).map((r) => r.role as UserRole);
        if (roles.length === 0 && (fallback === 'admin' || fallback === 'teacher')) {
          roles.push(fallback as UserRole);
        }

        if (error) {
          console.warn('useUserRole: user_roles query error, using metadata fallback', error);
        }

        if (cancelled) return;
        const top = PRIORITY.find((p) => roles.includes(p)) ?? 'user';
        setRole(top);
        setIsAdmin(top === 'admin');
        setIsTeacher(top === 'teacher');
      } catch (err) {
        console.error('Error in fetchUserRole:', err);
        if (cancelled) return;
        setRole('user');
        setIsAdmin(false);
        setIsTeacher(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUserRole();

    // Re-fetch when the auth state changes (sign-in / sign-out / token
    // refresh) so a session that started without a role row picks up the
    // role as soon as it's seeded, without a full page reload.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { role, isAdmin, isTeacher, loading };
}
