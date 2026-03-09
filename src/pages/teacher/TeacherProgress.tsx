import { useEffect, useRef } from 'react';
import { TeacherLayout } from "@/components/TeacherLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gsap } from 'gsap';
import { TrendingUp, TrendingDown, Users, BarChart3 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// Sample data: 4 assignments + 4 quizzes with class averages
const assessmentData = [
  { name: 'Quiz 1', type: 'Quiz', average: 72, highest: 95, lowest: 38 },
  { name: 'Assign 1', type: 'Assignment', average: 78, highest: 98, lowest: 45 },
  { name: 'Quiz 2', type: 'Quiz', average: 65, highest: 90, lowest: 30 },
  { name: 'Assign 2', type: 'Assignment', average: 70, highest: 92, lowest: 35 },
  { name: 'Quiz 3', type: 'Quiz', average: 58, highest: 88, lowest: 22 },
  { name: 'Assign 3', type: 'Assignment', average: 74, highest: 96, lowest: 40 },
  { name: 'Quiz 4', type: 'Quiz', average: 63, highest: 91, lowest: 28 },
  { name: 'Assign 4', type: 'Assignment', average: 80, highest: 99, lowest: 50 },
];

const quizData = assessmentData.filter(d => d.type === 'Quiz');
const assignmentData = assessmentData.filter(d => d.type === 'Assignment');

// Grade distribution per assessment
const gradeDistribution = [
  { name: 'Quiz 1', A: 8, B: 15, C: 12, D: 5, F: 2 },
  { name: 'Assign 1', A: 12, B: 14, C: 10, D: 4, F: 2 },
  { name: 'Quiz 2', A: 5, B: 10, C: 14, D: 8, F: 5 },
  { name: 'Assign 2', A: 7, B: 12, C: 13, D: 6, F: 4 },
  { name: 'Quiz 3', A: 3, B: 8, C: 15, D: 10, F: 6 },
  { name: 'Assign 3', A: 10, B: 13, C: 11, D: 5, F: 3 },
  { name: 'Quiz 4', A: 6, B: 11, C: 13, D: 7, F: 5 },
  { name: 'Assign 4', A: 14, B: 15, C: 8, D: 3, F: 2 },
];

const overallAvg = Math.round(assessmentData.reduce((s, d) => s + d.average, 0) / assessmentData.length);
const latestTrend = assessmentData[assessmentData.length - 1].average - assessmentData[assessmentData.length - 2].average;

const TeacherProgress = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.animate-card');
    gsap.fromTo(cards, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
  }, []);

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
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assessments</p>
                  <p className="text-2xl font-bold">8 <span className="text-sm font-normal text-muted-foreground">total</span></p>
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
                <AreaChart data={assessmentData}>
                  <defs>
                    <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="average" stroke="hsl(var(--primary))" fill="url(#avgGradient)" strokeWidth={2} name="Class Average" />
                  <Line type="monotone" dataKey="highest" stroke="hsl(120, 60%, 50%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Highest" />
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
                    <Line type="monotone" dataKey="highest" stroke="hsl(120, 60%, 50%)" strokeWidth={1.5} dot={{ r: 3 }} name="Highest" />
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
                  <LineChart data={assignmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }} />
                    <Line type="monotone" dataKey="average" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 5, fill: 'hsl(var(--accent))' }} name="Average" />
                    <Line type="monotone" dataKey="highest" stroke="hsl(120, 60%, 50%)" strokeWidth={1.5} dot={{ r: 3 }} name="Highest" />
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
                <BarChart data={gradeDistribution}>
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
