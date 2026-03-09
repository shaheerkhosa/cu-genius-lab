import { useState, useEffect, useRef } from 'react';
import { TeacherLayout } from "@/components/TeacherLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, FileText, ClipboardList, BookOpen, GraduationCap, CalendarDays } from 'lucide-react';
import { gsap } from 'gsap';
import { format, isToday, isTomorrow, isThisWeek, isPast, parseISO } from 'date-fns';

const courses = [
  { code: 'ALL', name: 'All Courses' },
  { code: 'CS403', name: 'Computer Networks' },
  { code: 'CS401', name: 'Software Engineering' },
  { code: 'CS402', name: 'Operating Systems' },
  { code: 'CS404', name: 'Artificial Intelligence' },
];

const typeIcons: Record<string, React.ReactNode> = {
  quiz: <ClipboardList className="w-4 h-4" />,
  assignment: <FileText className="w-4 h-4" />,
  midterm: <BookOpen className="w-4 h-4" />,
  final: <GraduationCap className="w-4 h-4" />,
};

const TeacherSchedule = () => {
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      let query = supabase.from('assessments').select('*').order('created_at', { ascending: false });
      if (selectedCourse !== 'ALL') query = query.eq('course_code', selectedCourse);
      const { data } = await query;
      setAssessments(data || []);
      setLoading(false);
    };
    fetchAll();
  }, [selectedCourse]);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.animate-card');
      gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }
  }, [assessments]);

  const upcoming = assessments.filter(a => a.schedule_end && !isPast(parseISO(a.schedule_end)));
  const past = assessments.filter(a => !a.schedule_end || isPast(parseISO(a.schedule_end)));

  const getDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    if (isThisWeek(d)) return format(d, 'EEEE');
    return format(d, 'MMM d, yyyy');
  };

  const renderAssessmentCard = (a: any) => {
    const hasSchedule = a.schedule_start && a.schedule_end;
    const isLive = hasSchedule && new Date() >= new Date(a.schedule_start) && new Date() <= new Date(a.schedule_end);
    const isUpcoming = hasSchedule && new Date() < new Date(a.schedule_start);

    return (
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
                {hasSchedule && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {getDateLabel(a.schedule_start)} • {format(parseISO(a.schedule_start), 'h:mm a')} — {format(parseISO(a.schedule_end), 'h:mm a')}
                  </div>
                )}
                {!hasSchedule && (
                  <p className="text-xs text-muted-foreground mt-1">Created {format(parseISO(a.created_at), 'MMM d, yyyy')}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="outline" className="text-xs capitalize">{a.assessment_type}</Badge>
              <Badge variant="outline" className="text-xs">{a.total_marks} marks</Badge>
              {isLive && <Badge className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 border-0">● Live</Badge>}
              {isUpcoming && <Badge variant="secondary" className="text-xs">Upcoming</Badge>}
              {a.is_marks_finalized && <Badge className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 border-0">Finalized</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <TeacherLayout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />
        <div ref={containerRef} className="relative z-10 max-w-5xl mx-auto space-y-6">
          <div className="animate-card text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <CalendarDays className="w-4 h-4" />
              Schedule
            </div>
            <h1 className="text-4xl font-bold text-foreground">Class Schedule</h1>
            <p className="text-muted-foreground">View all your assessments and deadlines</p>
          </div>

          <div className="animate-card flex justify-center">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[320px] rounded-xl h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.code === 'ALL' ? 'All Courses' : `${c.code} — ${c.name}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Upcoming</h2>
                  {upcoming.map(renderAssessmentCard)}
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-muted-foreground" /> Past / No Deadline</h2>
                {past.length === 0 ? (
                  <Card className="backdrop-blur border border-border/50 bg-card/80">
                    <CardContent className="py-12 text-center text-muted-foreground">No assessments found.</CardContent>
                  </Card>
                ) : past.map(renderAssessmentCard)}
              </div>
            </>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherSchedule;
