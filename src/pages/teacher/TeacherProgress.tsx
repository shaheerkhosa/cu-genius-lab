import { useEffect, useRef, useState, useMemo } from 'react';
import { TeacherLayout } from "@/components/TeacherLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { gsap } from 'gsap';
import { TrendingUp, TrendingDown, Users, BarChart3 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface CourseData {
  code: string;
  name: string;
  students: number;
  assessments: { name: string; type: string; average: number; highest: number; lowest: number }[];
  gradeDistribution: { name: string; A: number; B: number; C: number; D: number; F: number }[];
}

const coursesData: CourseData[] = [
  {
    code: 'CS403', name: 'Computer Networks', students: 42,
    assessments: [
      { name: 'Quiz 1', type: 'Quiz', average: 72, highest: 95, lowest: 38 },
      { name: 'Assign 1', type: 'Assignment', average: 78, highest: 98, lowest: 45 },
      { name: 'Quiz 2', type: 'Quiz', average: 65, highest: 90, lowest: 30 },
      { name: 'Assign 2', type: 'Assignment', average: 70, highest: 92, lowest: 35 },
      { name: 'Quiz 3', type: 'Quiz', average: 58, highest: 88, lowest: 22 },
      { name: 'Assign 3', type: 'Assignment', average: 74, highest: 96, lowest: 40 },
      { name: 'Quiz 4', type: 'Quiz', average: 63, highest: 91, lowest: 28 },
      { name: 'Assign 4', type: 'Assignment', average: 80, highest: 99, lowest: 50 },
    ],
    gradeDistribution: [
      { name: 'Quiz 1', A: 8, B: 15, C: 12, D: 5, F: 2 },
      { name: 'Assign 1', A: 12, B: 14, C: 10, D: 4, F: 2 },
      { name: 'Quiz 2', A: 5, B: 10, C: 14, D: 8, F: 5 },
      { name: 'Assign 2', A: 7, B: 12, C: 13, D: 6, F: 4 },
      { name: 'Quiz 3', A: 3, B: 8, C: 15, D: 10, F: 6 },
      { name: 'Assign 3', A: 10, B: 13, C: 11, D: 5, F: 3 },
      { name: 'Quiz 4', A: 6, B: 11, C: 13, D: 7, F: 5 },
      { name: 'Assign 4', A: 14, B: 15, C: 8, D: 3, F: 2 },
    ],
  },
  {
    code: 'CS401', name: 'Software Engineering', students: 38,
    assessments: [
      { name: 'Quiz 1', type: 'Quiz', average: 80, highest: 97, lowest: 45 },
      { name: 'Assign 1', type: 'Assignment', average: 85, highest: 100, lowest: 55 },
      { name: 'Quiz 2', type: 'Quiz', average: 74, highest: 93, lowest: 40 },
      { name: 'Assign 2', type: 'Assignment', average: 82, highest: 98, lowest: 50 },
      { name: 'Quiz 3', type: 'Quiz', average: 70, highest: 90, lowest: 35 },
      { name: 'Assign 3', type: 'Assignment', average: 77, highest: 95, lowest: 42 },
      { name: 'Quiz 4', type: 'Quiz', average: 76, highest: 94, lowest: 38 },
      { name: 'Assign 4', type: 'Assignment', average: 88, highest: 100, lowest: 60 },
    ],
    gradeDistribution: [
      { name: 'Quiz 1', A: 12, B: 14, C: 8, D: 3, F: 1 },
      { name: 'Assign 1', A: 16, B: 12, C: 7, D: 2, F: 1 },
      { name: 'Quiz 2', A: 8, B: 13, C: 11, D: 4, F: 2 },
      { name: 'Assign 2', A: 14, B: 12, C: 8, D: 3, F: 1 },
      { name: 'Quiz 3', A: 6, B: 11, C: 13, D: 6, F: 2 },
      { name: 'Assign 3', A: 10, B: 13, C: 10, D: 4, F: 1 },
      { name: 'Quiz 4', A: 9, B: 14, C: 10, D: 4, F: 1 },
      { name: 'Assign 4', A: 18, B: 12, C: 6, D: 1, F: 1 },
    ],
  },
  {
    code: 'CS402', name: 'Operating Systems', students: 45,
    assessments: [
      { name: 'Quiz 1', type: 'Quiz', average: 68, highest: 92, lowest: 32 },
      { name: 'Assign 1', type: 'Assignment', average: 72, highest: 95, lowest: 38 },
      { name: 'Quiz 2', type: 'Quiz', average: 55, highest: 85, lowest: 20 },
      { name: 'Assign 2', type: 'Assignment', average: 65, highest: 90, lowest: 30 },
      { name: 'Quiz 3', type: 'Quiz', average: 50, highest: 82, lowest: 15 },
      { name: 'Assign 3', type: 'Assignment', average: 68, highest: 93, lowest: 35 },
      { name: 'Quiz 4', type: 'Quiz', average: 60, highest: 88, lowest: 25 },
      { name: 'Assign 4', type: 'Assignment', average: 75, highest: 97, lowest: 42 },
    ],
    gradeDistribution: [
      { name: 'Quiz 1', A: 6, B: 12, C: 15, D: 8, F: 4 },
      { name: 'Assign 1', A: 8, B: 14, C: 13, D: 7, F: 3 },
      { name: 'Quiz 2', A: 3, B: 8, C: 14, D: 12, F: 8 },
      { name: 'Assign 2', A: 5, B: 10, C: 15, D: 10, F: 5 },
      { name: 'Quiz 3', A: 2, B: 6, C: 13, D: 14, F: 10 },
      { name: 'Assign 3', A: 7, B: 12, C: 14, D: 8, F: 4 },
      { name: 'Quiz 4', A: 4, B: 10, C: 15, D: 10, F: 6 },
      { name: 'Assign 4', A: 10, B: 15, C: 12, D: 5, F: 3 },
    ],
  },
  {
    code: 'CS404', name: 'Artificial Intelligence', students: 35,
    assessments: [
      { name: 'Quiz 1', type: 'Quiz', average: 76, highest: 96, lowest: 42 },
      { name: 'Assign 1', type: 'Assignment', average: 82, highest: 100, lowest: 50 },
      { name: 'Quiz 2', type: 'Quiz', average: 70, highest: 92, lowest: 35 },
      { name: 'Assign 2', type: 'Assignment', average: 78, highest: 97, lowest: 45 },
      { name: 'Quiz 3', type: 'Quiz', average: 65, highest: 89, lowest: 30 },
      { name: 'Assign 3', type: 'Assignment', average: 80, highest: 98, lowest: 48 },
      { name: 'Quiz 4', type: 'Quiz', average: 72, highest: 94, lowest: 38 },
      { name: 'Assign 4', type: 'Assignment', average: 85, highest: 100, lowest: 55 },
    ],
    gradeDistribution: [
      { name: 'Quiz 1', A: 9, B: 12, C: 9, D: 4, F: 1 },
      { name: 'Assign 1', A: 13, B: 11, C: 7, D: 3, F: 1 },
      { name: 'Quiz 2', A: 6, B: 10, C: 12, D: 5, F: 2 },
      { name: 'Assign 2', A: 10, B: 12, C: 8, D: 4, F: 1 },
      { name: 'Quiz 3', A: 4, B: 9, C: 13, D: 7, F: 2 },
      { name: 'Assign 3', A: 12, B: 11, C: 8, D: 3, F: 1 },
      { name: 'Quiz 4', A: 7, B: 12, C: 10, D: 5, F: 1 },
      { name: 'Assign 4', A: 15, B: 12, C: 5, D: 2, F: 1 },
    ],
  },
];

const TeacherProgress = () => {
  const [selectedCourse, setSelectedCourse] = useState(coursesData[0].code);
  const containerRef = useRef<HTMLDivElement>(null);

  const course = useMemo(() => coursesData.find(c => c.code === selectedCourse)!, [selectedCourse]);
  const quizData = useMemo(() => course.assessments.filter(d => d.type === 'Quiz'), [course]);
  const assignmentDataFiltered = useMemo(() => course.assessments.filter(d => d.type === 'Assignment'), [course]);
  const overallAvg = useMemo(() => Math.round(course.assessments.reduce((s, d) => s + d.average, 0) / course.assessments.length), [course]);
  const latestTrend = useMemo(() => course.assessments[course.assessments.length - 1].average - course.assessments[course.assessments.length - 2].average, [course]);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.animate-card');
    gsap.fromTo(cards, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
  }, [selectedCourse]);

  return (
    <TeacherLayout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />

        <div ref={containerRef} className="relative z-10 max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="animate-card text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <BarChart3 className="w-4 h-4" />
              Class Analytics
            </div>
            <h1 className="text-4xl font-bold text-foreground">Student Progress</h1>
            <p className="text-muted-foreground">Track class performance across assignments and quizzes</p>
          </div>

          {/* Course Selector */}
          <div className="animate-card flex justify-center">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[320px] rounded-xl h-12 text-base">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {coursesData.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class Average</p>
                  <p className="text-2xl font-bold">{overallAvg}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${latestTrend >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {latestTrend >= 0 ? <TrendingUp className="w-6 h-6 text-green-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Latest Trend</p>
                  <p className="text-2xl font-bold">{latestTrend >= 0 ? '+' : ''}{latestTrend}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Students Enrolled</p>
                  <p className="text-2xl font-bold">{course.students}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Trend Line */}
          <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Class Average Trend
                <Badge variant="secondary" className="text-xs font-normal">All Assessments</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={course.assessments}>
                  <defs>
                    <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }} />
                  <Area type="monotone" dataKey="average" stroke="hsl(var(--primary))" fill="url(#avgGradient)" strokeWidth={2} name="Class Average" />
                  <Line type="monotone" dataKey="highest" stroke="hsl(142, 71%, 45%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Highest" />
                  <Line type="monotone" dataKey="lowest" stroke="hsl(0, 60%, 50%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Lowest" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quiz vs Assignment Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Quiz Scores
                  <Badge variant="outline" className="text-xs">4 Quizzes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={quizData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }} />
                    <Line type="monotone" dataKey="average" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 5, fill: 'hsl(var(--primary))' }} name="Average" />
                    <Line type="monotone" dataKey="highest" stroke="hsl(142, 71%, 45%)" strokeWidth={1.5} dot={{ r: 3 }} name="Highest" />
                    <Line type="monotone" dataKey="lowest" stroke="hsl(0, 60%, 50%)" strokeWidth={1.5} dot={{ r: 3 }} name="Lowest" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Assignment Scores
                  <Badge variant="outline" className="text-xs">4 Assignments</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={assignmentDataFiltered}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }} />
                    <Line type="monotone" dataKey="average" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 5, fill: 'hsl(var(--accent))' }} name="Average" />
                    <Line type="monotone" dataKey="highest" stroke="hsl(142, 71%, 45%)" strokeWidth={1.5} dot={{ r: 3 }} name="Highest" />
                    <Line type="monotone" dataKey="lowest" stroke="hsl(0, 60%, 50%)" strokeWidth={1.5} dot={{ r: 3 }} name="Lowest" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Grade Distribution */}
          <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Grade Distribution
                <Badge variant="secondary" className="text-xs font-normal">Per Assessment</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={course.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }} />
                  <Legend />
                  <Bar dataKey="A" stackId="a" fill="hsl(142, 71%, 45%)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="B" stackId="a" fill="hsl(217, 91%, 60%)" />
                  <Bar dataKey="C" stackId="a" fill="hsl(48, 96%, 53%)" />
                  <Bar dataKey="D" stackId="a" fill="hsl(25, 95%, 53%)" />
                  <Bar dataKey="F" stackId="a" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherProgress;
