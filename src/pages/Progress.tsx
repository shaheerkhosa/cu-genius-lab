import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ClipboardList, 
  TrendingUp, 
  AlertCircle,
  Clock,
  FileText,
  Loader2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { supabase } from "@/integrations/supabase/client";
import { 
  attendanceRecords, 
  academicAlerts,
} from "@/data/academicDashboardData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AssessmentItem {
  id: string;
  title: string;
  course_code: string;
  course_name: string;
  assessment_type: string;
  total_marks: number;
  schedule_start: string | null;
  schedule_end: string | null;
  is_online_quiz: boolean;
  created_at: string;
}

interface CourseMarkSummary {
  courseCode: string;
  courseName: string;
  totalObtained: number;
  totalPossible: number;
  percentage: number;
  grade: string;
}

interface TrendPoint {
  name: string;
  score: number;
}

const getGrade = (pct: number) => {
  if (pct >= 90) return 'A+';
  if (pct >= 85) return 'A';
  if (pct >= 80) return 'A-';
  if (pct >= 75) return 'B+';
  if (pct >= 70) return 'B';
  if (pct >= 65) return 'B-';
  if (pct >= 60) return 'C+';
  if (pct >= 55) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
};

const Progress = () => {
  const [loading, setLoading] = useState(true);
  const [upcomingAssessments, setUpcomingAssessments] = useState<AssessmentItem[]>([]);
  const [courseMarks, setCourseMarks] = useState<CourseMarkSummary[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<TrendPoint[]>([]);

  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const trendsRef = useRef<HTMLDivElement>(null);
  const quizzesRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_code')
        .eq('student_id', user.id);

      const enrolledCodes = enrollments?.map(e => e.course_code) || [];

      // Fetch assessments for enrolled courses
      let assessments: AssessmentItem[] = [];
      if (enrolledCodes.length > 0) {
        const { data } = await supabase
          .from('assessments')
          .select('*')
          .in('course_code', enrolledCodes)
          .order('created_at', { ascending: true });
        assessments = (data as AssessmentItem[]) || [];
      }

      // Upcoming assessments: schedule_end in future
      const now = new Date();
      const upcoming = assessments.filter(a => {
        if (a.schedule_end) return new Date(a.schedule_end) > now;
        return false;
      }).slice(0, 6);
      setUpcomingAssessments(upcoming);

      // Fetch real marks for this student
      const { data: myMarks } = await supabase
        .from('student_marks')
        .select('*, assessments!student_marks_assessment_id_fkey(course_code, course_name, total_marks, title, assessment_type, created_at)')
        .eq('student_id', user.id)
        .not('marks_obtained', 'is', null);

      if (myMarks && myMarks.length > 0) {
        // Group marks by course
        const courseMap = new Map<string, { courseName: string; obtained: number; possible: number }>();
        const trendData: TrendPoint[] = [];

        for (const mark of myMarks) {
          const assessment = mark.assessments as any;
          if (!assessment) continue;

          const code = assessment.course_code;
          const existing = courseMap.get(code) || { courseName: assessment.course_name, obtained: 0, possible: 0 };
          existing.obtained += (mark.marks_obtained as number);
          existing.possible += assessment.total_marks;
          courseMap.set(code, existing);

          // Add to trend
          trendData.push({
            name: `${assessment.title}`,
            score: Math.round(((mark.marks_obtained as number) / assessment.total_marks) * 100),
          });
        }

        const marks: CourseMarkSummary[] = Array.from(courseMap.entries()).map(([code, data]) => {
          const pct = data.possible > 0 ? Math.round((data.obtained / data.possible) * 100) : 0;
          return {
            courseCode: code,
            courseName: data.courseName,
            totalObtained: data.obtained,
            totalPossible: data.possible,
            percentage: pct,
            grade: getGrade(pct),
          };
        });
        setCourseMarks(marks);
        setPerformanceTrend(trendData.slice(0, 12));
      } else {
        setCourseMarks([]);
        setPerformanceTrend([]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const tl = gsap.timeline();
    if (headerRef.current && statsRef.current && trendsRef.current && quizzesRef.current && alertsRef.current) {
      tl.fromTo(headerRef.current, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
        .fromTo(statsRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
        .fromTo(trendsRef.current, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2')
        .fromTo(quizzesRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
        .fromTo(alertsRef.current, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    }
  }, [loading]);

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case "good": return "bg-green-400/20";
      case "warning": return "bg-yellow-400/20";
      case "critical": return "bg-red-400/20";
      default: return "bg-secondary/20";
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-400/20 border-red-400/30";
      case "warning": return "bg-yellow-400/20 border-yellow-400/30";
      default: return "bg-blue-400/20 border-blue-400/30";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div ref={headerRef}>
            <h1 className="text-4xl font-bold text-primary mb-2">Academic Dashboard</h1>
            <p className="text-muted-foreground mb-8">Track your progress and stay on top of your academics</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mark Statistics */}
            <div ref={statsRef} className="lg:col-span-1">
              <Card className="bg-card/50 backdrop-blur-sm border-2 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Marks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {courseMarks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No marks available yet. Enroll in courses to see your grades.</p>
                  ) : (
                    courseMarks.map((mark) => (
                      <div key={mark.courseCode} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{mark.courseCode}</p>
                            <p className="text-xs text-muted-foreground truncate">{mark.courseName}</p>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`
                              ${mark.percentage >= 85 ? 'bg-green-400/20 text-green-700 dark:text-green-300' : ''}
                              ${mark.percentage >= 70 && mark.percentage < 85 ? 'bg-blue-400/20 text-blue-700 dark:text-blue-300' : ''}
                              ${mark.percentage >= 60 && mark.percentage < 70 ? 'bg-yellow-400/20 text-yellow-700 dark:text-yellow-300' : ''}
                              ${mark.percentage < 60 ? 'bg-red-400/20 text-red-700 dark:text-red-300' : ''}
                            `}
                          >
                            {mark.percentage}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={mark.percentage} className="h-2" />
                          <span className="text-xs font-medium text-muted-foreground">{mark.grade}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{mark.totalObtained}/{mark.totalPossible} marks</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Trend Chart */}
            <div ref={trendsRef} className="lg:col-span-2">
              <Card className="bg-card/50 backdrop-blur-sm border-2 border-border h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  {performanceTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={performanceTrend} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} angle={-20} textAnchor="end" height={50} />
                        <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} name="Score %" dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-16">No graded assessments yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Assessments */}
            <div ref={quizzesRef} className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Assessments
              </h2>
              {upcomingAssessments.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur-sm border border-border">
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No upcoming assessments scheduled.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingAssessments.map((a) => (
                    <Card 
                      key={a.id} 
                      className={`backdrop-blur-sm border hover:shadow-md transition-colors ${
                        a.assessment_type === 'quiz' ? 'bg-blue-400/10 border-blue-400/20' :
                        a.assessment_type === 'assignment' ? 'bg-purple-400/10 border-purple-400/20' :
                        'bg-orange-400/10 border-orange-400/20'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base capitalize">{a.assessment_type}</CardTitle>
                        <CardDescription className="font-semibold text-foreground">
                          {a.course_code} — {a.title}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground truncate">{a.course_name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{a.total_marks} marks</Badge>
                          {a.is_online_quiz && <Badge className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 border-0">Online</Badge>}
                        </div>
                        {a.schedule_end && (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">Due {formatDate(a.schedule_end)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Academic Alerts & Attendance */}
            <div ref={alertsRef} className="lg:col-span-1 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Alerts
                </h2>
                <div className="space-y-3">
                  {academicAlerts.map((alert) => (
                    <Card 
                      key={alert.id}
                      className={`backdrop-blur-sm border ${getAlertColor(alert.severity)}`}
                    >
                      <CardContent className="p-4">
                        <p className="font-semibold text-sm">{alert.courseCode}</p>
                        <p className="text-xs font-medium mt-1">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{alert.actionRequired}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Attendance</h3>
                <div className="space-y-3">
                  {attendanceRecords.map((record) => (
                    <Card 
                      key={record.courseCode}
                      className={`backdrop-blur-sm border border-border/50 ${getAttendanceColor(record.status)}`}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{record.courseCode}</p>
                            <p className="text-xs text-muted-foreground truncate">{record.courseName}</p>
                          </div>
                          <Badge variant="secondary">
                            {record.percentage}%
                          </Badge>
                        </div>
                        <ProgressBar value={record.percentage} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">
                          {record.attended}/{record.total} classes
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Progress;