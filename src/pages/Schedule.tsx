import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, FileText, ClipboardList, BookOpen, GraduationCap, CalendarDays, CheckCircle2 } from 'lucide-react';
import { gsap } from 'gsap';
import { format, isPast, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';

const typeIcons: Record<string, React.ReactNode> = {
  quiz: <ClipboardList className="w-4 h-4" />,
  assignment: <FileText className="w-4 h-4" />,
  midterm: <BookOpen className="w-4 h-4" />,
  final: <GraduationCap className="w-4 h-4" />,
};

const Schedule = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch assessments for enrolled courses
      const { data: aData } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch attendance records
      const { data: attData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
        .order('date', { ascending: false });

      setAssessments(aData || []);
      setAttendance(attData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.animate-card');
      gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }
  }, [assessments, attendance]);

  const getDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    if (isThisWeek(d)) return format(d, 'EEEE');
    return format(d, 'MMM d, yyyy');
  };

  const upcoming = assessments.filter(a => a.schedule_end && !isPast(parseISO(a.schedule_end)));
  const past = assessments.filter(a => !a.schedule_end || isPast(parseISO(a.schedule_end)));

  // Attendance summary per course
  const attendanceByCourse: Record<string, { present: number; absent: number; late: number; total: number }> = {};
  attendance.forEach(a => {
    if (!attendanceByCourse[a.course_code]) attendanceByCourse[a.course_code] = { present: 0, absent: 0, late: 0, total: 0 };
    attendanceByCourse[a.course_code].total++;
    if (a.status === 'present') attendanceByCourse[a.course_code].present++;
    else if (a.status === 'absent') attendanceByCourse[a.course_code].absent++;
    else if (a.status === 'late') attendanceByCourse[a.course_code].late++;
  });

  return (
    <Layout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />
        <div ref={containerRef} className="relative z-10 max-w-5xl mx-auto space-y-6">
          <div className="animate-card text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <CalendarDays className="w-4 h-4" />
              Schedule
            </div>
            <h1 className="text-4xl font-bold text-foreground">My Schedule</h1>
            <p className="text-muted-foreground">Your upcoming assessments, deadlines, and attendance</p>
          </div>

          {/* Attendance Summary */}
          {Object.keys(attendanceByCourse).length > 0 && (
            <div className="animate-card space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Attendance Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(attendanceByCourse).map(([code, stats]) => {
                  const pct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                  return (
                    <Card key={code} className="backdrop-blur border border-border/50 bg-card/80">
                      <CardContent className="p-4">
                        <p className="font-semibold text-sm">{code}</p>
                        <p className={`text-2xl font-bold mt-1 ${pct >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{pct}%</p>
                        <p className="text-xs text-muted-foreground">{stats.present}P / {stats.absent}A / {stats.late}L of {stats.total}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Upcoming</h2>
                  {upcoming.map(a => (
                    <Card key={a.id} className="animate-card backdrop-blur border border-border/50 bg-card/80 hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary">
                              {typeIcons[a.assessment_type] || <FileText className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm">{a.title}</h3>
                              <p className="text-xs text-muted-foreground">{a.course_code} — {a.course_name}</p>
                              {a.schedule_start && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {getDateLabel(a.schedule_start)} • {format(parseISO(a.schedule_start), 'h:mm a')}
                                  {a.schedule_end && <> — {format(parseISO(a.schedule_end), 'h:mm a')}</>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant="outline" className="text-xs capitalize">{a.assessment_type}</Badge>
                            <Badge variant="outline" className="text-xs">{a.total_marks} marks</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-muted-foreground" /> Past / No Deadline</h2>
                {past.length === 0 ? (
                  <Card className="backdrop-blur border border-border/50 bg-card/80">
                    <CardContent className="py-12 text-center text-muted-foreground">No assessments found.</CardContent>
                  </Card>
                ) : past.map(a => (
                  <Card key={a.id} className="animate-card backdrop-blur border border-border/50 bg-card/80">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="mt-0.5 p-2 rounded-lg bg-muted/50 text-muted-foreground">
                            {typeIcons[a.assessment_type] || <FileText className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm">{a.title}</h3>
                            <p className="text-xs text-muted-foreground">{a.course_code} — {a.course_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">Created {format(parseISO(a.created_at), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{a.assessment_type}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Schedule;
