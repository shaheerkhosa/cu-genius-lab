import { useState, useEffect, useCallback, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

type Status = "present" | "absent" | "late";

interface AttendanceRecord {
  id: string;
  course_code: string;
  date: string;
  status: Status;
}

interface CourseMeta {
  course_code: string;
  course_name: string;
}

interface CourseSummary {
  code: string;
  name: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  attended: number; // present + late
  percentage: number;
  records: AttendanceRecord[];
}

const ATTENDANCE_FLOOR = 75; // typical Pakistani-uni eligibility threshold

const StudentAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courseMeta, setCourseMeta] = useState<Record<string, string>>({});
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_code")
      .eq("student_id", user.id);
    const codes = enrollments?.map((e) => e.course_code) ?? [];

    if (codes.length > 0) {
      const { data: tc } = await supabase
        .from("teacher_courses")
        .select("course_code, course_name")
        .in("course_code", codes);
      const map: Record<string, string> = {};
      (tc ?? []).forEach((c: CourseMeta) => {
        map[c.course_code] = c.course_name;
      });
      setCourseMeta(map);
    }

    const { data, error } = await supabase
      .from("attendance")
      .select("id, course_code, date, status")
      .eq("student_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Couldn't load attendance");
      setLoading(false);
      return;
    }

    setRecords((data ?? []) as AttendanceRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ─── aggregations ─────────────────────────────────────── */

  const courseSummaries: CourseSummary[] = useMemo(() => {
    const map = new Map<string, CourseSummary>();
    for (const r of records) {
      const existing = map.get(r.course_code) ?? {
        code: r.course_code,
        name: courseMeta[r.course_code] ?? "",
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        attended: 0,
        percentage: 0,
        records: [],
      };
      existing.total += 1;
      if (r.status === "present") existing.present += 1;
      else if (r.status === "absent") existing.absent += 1;
      else if (r.status === "late") existing.late += 1;
      existing.records.push(r);
      map.set(r.course_code, existing);
    }
    const out: CourseSummary[] = [];
    map.forEach((c) => {
      c.attended = c.present + c.late;
      c.percentage = c.total > 0 ? Math.round((c.attended / c.total) * 100) : 0;
      out.push(c);
    });
    out.sort((a, b) => a.percentage - b.percentage); // worst first — actionable
    return out;
  }, [records, courseMeta]);

  const overall = useMemo(() => {
    const total = records.length;
    const attended = records.filter((r) => r.status !== "absent").length;
    const present = records.filter((r) => r.status === "present").length;
    const late = records.filter((r) => r.status === "late").length;
    const absent = records.filter((r) => r.status === "absent").length;
    return {
      total,
      attended,
      present,
      late,
      absent,
      percentage: total > 0 ? Math.round((attended / total) * 100) : 0,
    };
  }, [records]);

  const atRiskCourses = courseSummaries.filter((c) => c.percentage < ATTENDANCE_FLOOR);

  return (
    <Layout>
      <DecorativeBackground />
      <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-10 space-y-8">
        {/* Header */}
        <header className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80 font-medium">
              Class register
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-1">Attendance</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Your attendance per course, recorded by your instructors. The {ATTENDANCE_FLOOR}% line is the typical
              eligibility threshold — anything below puts you at risk.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAll}
            disabled={loading}
            className="rounded-xl gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Hero summary */}
            <section className="grid md:grid-cols-[auto,minmax(0,1fr)] gap-6 items-stretch">
              <Card className="backdrop-blur border border-border/50 bg-card/80">
                <CardContent className="p-6 flex items-center gap-6">
                  <Ring percentage={overall.percentage} />
                  <div className="space-y-1.5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Overall
                    </p>
                    <p className="text-3xl font-bold leading-none">{overall.percentage}%</p>
                    <p className="text-xs text-muted-foreground">
                      {overall.attended} of {overall.total} classes attended
                    </p>
                    <StatusPill percentage={overall.percentage} />
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur border border-border/50 bg-card/80">
                <CardContent className="p-6 grid grid-cols-3 gap-4 h-full content-center">
                  <Stat
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="Present"
                    value={overall.present}
                    tone="emerald"
                  />
                  <Stat
                    icon={<Clock className="w-4 h-4" />}
                    label="Late"
                    value={overall.late}
                    tone="amber"
                  />
                  <Stat
                    icon={<XCircle className="w-4 h-4" />}
                    label="Absent"
                    value={overall.absent}
                    tone="rose"
                  />
                </CardContent>
              </Card>
            </section>

            {/* At-risk warning */}
            {atRiskCourses.length > 0 && (
              <Card className="border-rose-500/40 bg-rose-500/5 backdrop-blur">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                      {atRiskCourses.length === 1
                        ? "1 course below the eligibility threshold"
                        : `${atRiskCourses.length} courses below the eligibility threshold`}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {atRiskCourses.map((c) => (
                        <Badge
                          key={c.code}
                          variant="outline"
                          className="font-mono text-[10px] border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10"
                        >
                          {c.code} · {c.percentage}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Per-course breakdown */}
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">By course</h2>
                <span className="text-xs text-muted-foreground">Sorted: lowest first</span>
              </div>
              <div className="space-y-3">
                {courseSummaries.map((c) => (
                  <CourseRow
                    key={c.code}
                    course={c}
                    expanded={expandedCourse === c.code}
                    onToggle={() => setExpandedCourse(expandedCourse === c.code ? null : c.code)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
};

/* ─── ring progress (SVG) ──────────────────────────────────── */

const Ring = ({ percentage, size = 96 }: { percentage: number; size?: number }) => {
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(percentage, 100) / 100) * circ;
  const tone =
    percentage >= 85 ? "stroke-emerald-500" :
    percentage >= ATTENDANCE_FLOOR ? "stroke-blue-500" :
    percentage >= 70 ? "stroke-amber-500" : "stroke-rose-500";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={6}
          className="stroke-muted/40"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={6}
          fill="transparent"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${tone} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold tabular-nums">{percentage}%</span>
      </div>
    </div>
  );
};

/* ─── status pill ──────────────────────────────────────────── */

const StatusPill = ({ percentage }: { percentage: number }) => {
  if (percentage >= 85) {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] rounded-lg">
        <TrendingUp className="w-3 h-3" />
        On track
      </Badge>
    );
  }
  if (percentage >= ATTENDANCE_FLOOR) {
    return (
      <Badge className="gap-1 bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[10px] rounded-lg">
        Eligible
      </Badge>
    );
  }
  if (percentage >= 70) {
    return (
      <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] rounded-lg">
        <AlertTriangle className="w-3 h-3" />
        Warning
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[10px] rounded-lg">
      <AlertTriangle className="w-3 h-3" />
      Critical
    </Badge>
  );
};

/* ─── stat tile ───────────────────────────────────────────── */

const Stat = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "emerald" | "amber" | "rose";
}) => {
  const cls = {
    emerald: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    amber: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    rose: "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
  }[tone];
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-90">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
    </div>
  );
};

/* ─── course row ──────────────────────────────────────────── */

const CourseRow = ({
  course,
  expanded,
  onToggle,
}: {
  course: CourseSummary;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const tone =
    course.percentage >= 85 ? "emerald" :
    course.percentage >= ATTENDANCE_FLOOR ? "blue" :
    course.percentage >= 70 ? "amber" : "rose";
  const barCls = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[tone];
  const stripCls = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[tone];

  return (
    <Card className="backdrop-blur border border-border/50 bg-card/80 overflow-hidden">
      <CardContent className="p-0">
        <button
          onClick={onToggle}
          className="w-full text-left p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors"
        >
          <div className={`w-1 self-stretch rounded-full ${stripCls}`} aria-hidden />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                {course.code}
              </Badge>
              <span className="text-sm font-medium truncate">{course.name || "Course"}</span>
              <StatusPill percentage={course.percentage} />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px] max-w-md h-2 rounded-full bg-muted/50 overflow-hidden relative">
                {/* threshold marker */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-foreground/30"
                  style={{ left: `${ATTENDANCE_FLOOR}%` }}
                  aria-label="75% threshold"
                />
                <div
                  className={`h-full ${barCls} transition-all duration-700`}
                  style={{ width: `${Math.min(course.percentage, 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold tabular-nums">{course.percentage}%</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {course.attended}/{course.total}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {course.present} present
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                {course.late} late
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                {course.absent} absent
              </span>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </button>

        {expanded && (
          <div className="border-t border-border/40 p-4 bg-muted/20 space-y-4">
            <Heatmap records={course.records} />
            <RecentRecords records={course.records.slice(0, 12)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ─── heatmap (last 8 weeks) ──────────────────────────────── */

const Heatmap = ({ records }: { records: AttendanceRecord[] }) => {
  // Map dates to status for quick lookup
  const byDate = new Map(records.map((r) => [r.date, r.status]));

  // Build last 56 days (8 weeks), oldest left
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { date: string; status: Status | null }[] = [];
  for (let i = 55; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ date: iso, status: byDate.get(iso) ?? null });
  }

  // Group into weeks (columns of 7)
  const weeks: { date: string; status: Status | null }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const cellCls = (status: Status | null) => {
    if (!status) return "bg-muted/30";
    if (status === "present") return "bg-emerald-500/70";
    if (status === "late") return "bg-amber-500/70";
    return "bg-rose-500/70";
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Last 8 weeks</p>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date} — ${day.status ?? "no class"}`}
                className={`w-3 h-3 rounded-sm ${cellCls(day.status)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" /> Present
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/70" /> Late
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/70" /> Absent
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-muted/40" /> No class
        </span>
      </div>
    </div>
  );
};

/* ─── recent records list ─────────────────────────────────── */

const RecentRecords = ({ records }: { records: AttendanceRecord[] }) => {
  if (records.length === 0) return null;
  const statusMeta: Record<Status, { label: string; cls: string; icon: React.ReactNode }> = {
    present: {
      label: "Present",
      cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    late: {
      label: "Late",
      cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      icon: <Clock className="w-3 h-3" />,
    },
    absent: {
      label: "Absent",
      cls: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Recent classes</p>
      <div className="grid sm:grid-cols-2 gap-1.5">
        {records.map((r) => {
          const m = statusMeta[r.status];
          const dateStr = new Date(r.date + "T00:00:00").toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          return (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-background/40 border border-border/40"
            >
              <span className="text-xs">{dateStr}</span>
              <Badge className={`gap-1 text-[10px] px-1.5 py-0 border ${m.cls}`}>
                {m.icon}
                {m.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── empty state ─────────────────────────────────────────── */

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 backdrop-blur p-16 text-center space-y-3">
    <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto">
      <CalendarCheck className="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold">No attendance recorded yet</h3>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
      Once your instructors start marking attendance, you'll see your record here.
    </p>
  </div>
);

export default StudentAttendance;
