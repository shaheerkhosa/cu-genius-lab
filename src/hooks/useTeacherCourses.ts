import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeacherCourse {
  code: string;
  name: string;
}

export function useTeacherCourses() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('teacher_courses')
        .select('course_code, course_name')
        .eq('teacher_id', user.id)
        .order('course_code');

      setCourses((data || []).map(d => ({ code: d.course_code, name: d.course_name })));
      setLoading(false);
    };
    fetch();
  }, []);

  return { courses, loading };
}
