import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUserRole() {
  const [role, setRole] = useState<'admin' | 'moderator' | 'user' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Query user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user'); // Default to regular user
          setIsAdmin(false);
        } else if (data) {
          const userRole = data.role as 'admin' | 'moderator' | 'user';
          setRole(userRole);
          setIsAdmin(userRole === 'admin');
        } else {
          setRole('user'); // No role assigned, default to user
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error in fetchUserRole:', err);
        setRole('user');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return { role, isAdmin, loading };
}
