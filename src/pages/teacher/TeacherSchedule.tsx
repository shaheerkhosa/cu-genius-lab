import { useState, useEffect, useRef } from 'react';
import { TeacherLayout } from "@/components/TeacherLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PillToggle } from "@/components/PillToggle";
import { supabase } from '@/integrations/supabase/client';
import { useTeacherCourses } from '@/hooks/useTeacherCourses';
import { Calendar, Clock, FileText, ClipboardList, BookOpen, GraduationCap, CalendarDays } from 'lucide-react';
import { gsap } from 'gsap';
import { format, isPast, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// No more hardcoded courses - we pull from teacher_courses

const typeIcons: Record<string, React.ReactNode> = {
  quiz: <ClipboardList className="w-4 h-4" />,
  assignment: <FileText className="w-4 h-4" />,
  midterm: <BookOpen className="w-4 h-4" />,
  final: <GraduationCap className="w-4 h-4" />,
};

interface TimetableSlot {
  id: string;
  course_code: string;
  course_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
}

const TeacherSchedule = () => {
  const { courses: teacherCourses } = useTeacherCourses();
  const allCoursesForFilter = [{ code: 'ALL', name: 'All Courses' }, ...teacherCourses];
  const [view, setView] = useState('timetable');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      if (view === 'timetable') {
        // Show only slots assigned to this teacher
        const { data } = await supabase.from('timetable').select('*')
          .eq('teacher_id', user.id)
          .order('day_of_week').order('start_time');
        setTimetable((data as TimetableSlot[]) || []);
      } else {
        let query = supabase.from('assessments').select('*').order('created_at', { ascending: false });
        if (selectedCourse !== 'ALL') query = query.eq('course_code', selectedCourse);
        const { data } = await query;
        setAssessments(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [view, selectedCourse]);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.animate-card');
      gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }
  }, [assessments, timetable, view]);

  const formatTime12 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    if (isThisWeek(d)) return format(d, 'EEEE');
    return format(d, 'MMM d, yyyy');
  };

  const upcoming = assessments.filter(a => a.schedule_end && !isPast(parseISO(a.schedule_end)));
  const past = assessments.filter(a => !a.schedule_end || isPast(parseISO(a.schedule_end)));
  const today = new Date().getDay();

  const slotsByDay: Record<number, TimetableSlot[]> = {};
  timetable.forEach(s => {
    if (!slotsByDay[s.day_of_week]) slotsByDay[s.day_of_week] = [];
    slotsByDay[s.day_of_week].push(s);
  });

  const renderTimetable = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Weekly Timetable</h2>
      {timetable.length === 0 ? (
        <Card className="backdrop-blur border border-border/50 bg-card/80">
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No classes assigned to you yet. The admin will manage your timetable.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {DAYS.map((dayName, dayIdx) => {
            const slots = slotsByDay[dayIdx];
            if (!slots || slots.length === 0) return null;
            const isCurrentDay = dayIdx === today;
            return (
              <Card key={dayIdx} className={`animate-card backdrop-blur border transition-all ${isCurrentDay ? 'border-primary/50 bg-primary/5 shadow-md' : 'border-border/50 bg-card/80'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-sm">{dayName}</h3>
                    {isCurrentDay && <Badge className="text-xs bg-primary/20 text-primary border-0">Today</Badge>}
                  </div>
                  <div className="space-y-2">
                    {slots.map(slot => (
                      <div key={slot.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                        <div className="text-center shrink-0">
                          <p className="text-xs font-semibold text-primary">{formatTime12(slot.start_time)}</p>
                          <p className="text-[10px] text-muted-foreground">to {formatTime12(slot.end_time)}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{slot.course_code} — {slot.course_name}</p>
                          {slot.room && <p className="text-xs text-muted-foreground">{slot.room}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <>
      <div className="flex justify-center mb-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[320px] rounded-xl h-12 text-base"><SelectValue /></SelectTrigger>
          <SelectContent>
            {allCoursesForFilter.map(c => (
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

          <div className="space-y-3 mt-4">
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
    </>
  );

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
            <p className="text-muted-foreground">Your weekly timetable and assessment history</p>
          </div>

          <div className="flex justify-center">
            <PillToggle
              value={view}
              onChange={setView}
              options={[
                { value: 'timetable', label: 'Timetable' },
                { value: 'history', label: 'History' },
              ]}
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : view === 'timetable' ? renderTimetable() : renderHistory()}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherSchedule;
