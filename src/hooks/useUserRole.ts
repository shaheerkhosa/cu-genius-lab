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
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
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

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user');
          setIsAdmin(false);
          setIsTeacher(false);
        } else {
          const roles = (data ?? []).map((r) => r.role as UserRole);
          const top = PRIORITY.find((p) => roles.includes(p)) ?? 'user';
          setRole(top);
          setIsAdmin(top === 'admin');
          setIsTeacher(top === 'teacher');
        }
      } catch (err) {
        console.error('Error in fetchUserRole:', err);
        setRole('user');
        setIsAdmin(false);
        setIsTeacher(false);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return { role, isAdmin, isTeacher, loading };
}
