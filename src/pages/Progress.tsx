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
  FileText
} from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { 
  upcomingQuizzes, 
  upcomingAssignments, 
  attendanceRecords, 
  markRecords,
  academicAlerts,
  performanceTrend
} from "@/data/academicDashboardData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Progress = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const trendsRef = useRef<HTMLDivElement>(null);
  const quizzesRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    hasAnimated.current = false;
    
    const tl = gsap.timeline();
    
    if (headerRef.current && statsRef.current && trendsRef.current && quizzesRef.current && alertsRef.current) {
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      )
      .fromTo(
        statsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      )
      .fromTo(
        trendsRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      )
      .fromTo(
        quizzesRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      )
      .fromTo(
        alertsRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      );
      
      hasAnimated.current = true;
    }
  });

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
                  {markRecords.map((mark) => (
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Performance Trend Chart */}
            <div ref={trendsRef} className="lg:col-span-2">
              <Card className="bg-card/50 backdrop-blur-sm border-2 border-border h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Performance Trend
                    </span>
                    <Badge variant="secondary" className="bg-green-400/20 text-green-700 dark:text-green-300">
                      +2.1% vs last sem
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={performanceTrend} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="week" 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="currentSemester" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Current Sem"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lastSemester" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        name="Last Sem"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Quizzes */}
            <div ref={quizzesRef} className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Assessments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upcomingQuizzes.map((quiz) => (
                  <Card 
                    key={quiz.id} 
                    className="bg-blue-400/10 backdrop-blur-sm border border-blue-400/20 hover:bg-blue-400/15 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Quiz</CardTitle>
                      <CardDescription className="font-semibold text-foreground">
                        {quiz.courseCode}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground truncate">{quiz.courseName}</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">{formatDate(quiz.date)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{quiz.time}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {upcomingAssignments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Assignments Due
                  </h3>
                  <div className="space-y-3">
                    {upcomingAssignments.map((assignment) => (
                      <Card 
                        key={assignment.id}
                        className="bg-purple-400/10 backdrop-blur-sm border border-purple-400/20"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{assignment.courseCode} - {assignment.title}</p>
                              <p className="text-sm text-muted-foreground">{assignment.courseName}</p>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <FileText className="h-3 w-3" />
                              <span className="font-medium">{formatDate(assignment.dueDate)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
