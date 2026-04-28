import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { PillToggle } from "@/components/PillToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  BookOpen,
  TrendingUp,
  GraduationCap,
  Loader2,
  History,
  Sparkles,
} from "lucide-react";

interface StudentRow {
  full_name: string;
  program: string;
  department: string;
  enrollment_year: number;
  year_of_study: number;
  gpa: number | null;
  roll_number: string;
}

const DEFAULT_PROGRAM_LENGTH_YEARS = 4;
const DEFAULT_TOTAL_CREDITS = 130;

const Estimator = () => {
  const [activeView, setActiveView] = useState<string>("gpa");
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentRow | null>(null);

  const headerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("students")
        .select("full_name, program, department, enrollment_year, year_of_study, gpa, roll_number")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (data) setStudent(data as StudentRow);
      setLoading(false);
    })();
  }, []);

  // Entrance animation
  useEffect(() => {
    if (loading) return;
    const tl = gsap.timeline();
    if (headerRef.current) {
      tl.fromTo(headerRef.current, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
    }
    if (toggleRef.current) {
      tl.fromTo(toggleRef.current, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }, "-=0.3");
    }
    if (contentRef.current) {
      tl.fromTo(contentRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2");
    }
  }, [loading]);

  // View switch animation
  useEffect(() => {
    if (contentRef.current && !loading) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: activeView === "gpa" ? -20 : 20 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" },
      );
    }
  }, [activeView, loading]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <div className="relative min-h-screen p-8">
          <DecorativeBackground />
          <div className="relative z-10 max-w-3xl mx-auto pt-16">
            <Card className="bg-card/60 backdrop-blur border border-border/60">
              <CardContent className="p-10 text-center space-y-3">
                <h2 className="text-2xl font-bold">No student profile linked</h2>
                <p className="text-sm text-muted-foreground">
                  We couldn't find a student record tied to your account. Reach out to the registrar to link your enrollment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // Derive a current "semester" number from year_of_study (semesters are 1-indexed,
  // 2 per year). We don't know mid-year vs. start-of-year so this is an estimate.
  const currentSemester = student.year_of_study * 2 - 1;
  const totalSemesters = DEFAULT_PROGRAM_LENGTH_YEARS * 2;
  const semestersRemaining = Math.max(0, totalSemesters - currentSemester);
  const progressPct = Math.min(100, Math.round(((totalSemesters - semestersRemaining) / totalSemesters) * 100));

  // Project graduation date assuming on-track progress.
  const graduationYear = student.enrollment_year + DEFAULT_PROGRAM_LENGTH_YEARS;
  const expectedGraduation = `Spring ${graduationYear}`;

  return (
    <Layout>
      <div className="relative min-h-screen p-4 md:p-8">
        <DecorativeBackground />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div ref={headerRef} className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Academic Estimator
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{student.full_name}</span>
              </div>
              <span className="hidden md:inline">•</span>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{student.program}</span>
              </div>
              <span className="hidden md:inline">•</span>
              <span>Year {student.year_of_study}</span>
            </div>
          </div>

          <div ref={toggleRef} className="flex justify-center">
            <PillToggle
              value={activeView}
              onChange={setActiveView}
              options={[
                { value: "gpa", label: "GPA" },
                { value: "graduation", label: "Graduation" },
              ]}
            />
          </div>

          <div ref={contentRef}>
            {activeView === "gpa" ? (
              <GPAPanel gpa={student.gpa} />
            ) : (
              <GraduationPanel
                expectedGraduation={expectedGraduation}
                semestersRemaining={semestersRemaining}
                currentSemester={currentSemester}
                totalSemesters={totalSemesters}
                progressPct={progressPct}
                program={student.program}
                enrollmentYear={student.enrollment_year}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const GPAPanel = ({ gpa }: { gpa: number | null }) => {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="bg-card/60 backdrop-blur border-2 border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" />
            Current CGPA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gpa !== null ? (
            <>
              <div className="text-5xl font-bold text-primary">{gpa.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">on a 4.00 scale</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Not yet recorded.</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 bg-card/60 backdrop-blur border border-dashed border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4 text-muted-foreground" />
            Trend Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Detailed GPA forecasting requires semester-by-semester transcript history. Once your past
            transcripts are imported, this view will show:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 list-disc">
            <li>Running CGPA across each semester</li>
            <li>Predicted final GPA with confidence range</li>
            <li>Trend analysis (improving / declining / stable)</li>
          </ul>
          <Badge variant="outline" className="gap-1.5 mt-2">
            <Sparkles className="w-3 h-3" />
            Coming soon
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

interface GraduationPanelProps {
  expectedGraduation: string;
  semestersRemaining: number;
  currentSemester: number;
  totalSemesters: number;
  progressPct: number;
  program: string;
  enrollmentYear: number;
}

const GraduationPanel = ({
  expectedGraduation,
  semestersRemaining,
  currentSemester,
  totalSemesters,
  progressPct,
  program,
  enrollmentYear,
}: GraduationPanelProps) => {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-card/60 backdrop-blur border-2 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-4 h-4 text-primary" />
              Expected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{expectedGraduation}</div>
            <p className="text-xs text-muted-foreground mt-1">{program}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Semesters remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{semestersRemaining}</div>
            <p className="text-xs text-muted-foreground mt-1">of {totalSemesters} total</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Program progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progressPct}%</div>
            <div className="h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/60 backdrop-blur border border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">Started {program}</span>
            <span className="text-muted-foreground ml-auto">Fall {enrollmentYear}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-medium">Currently in semester {currentSemester}</span>
            <span className="text-muted-foreground ml-auto">In progress</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            <span className="font-medium">Expected graduation</span>
            <span className="text-muted-foreground ml-auto">{expectedGraduation}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur border border-dashed border-border/60">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <p>
            Estimate assumes a {DEFAULT_PROGRAM_LENGTH_YEARS}-year program of {DEFAULT_TOTAL_CREDITS} credits and on-track progress.
            Risk-adjusted forecasts unlock once historical semester data is available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Estimator;
