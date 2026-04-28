import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProctoringEventsDialog } from "@/components/ProctoringEventsDialog";
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, MinusCircle, RefreshCw } from "lucide-react";

interface QuizAttemptsTableProps {
  assessmentId: string;
  courseCode: string;
  totalMarks: number;
}

interface AttemptRow {
  studentId: string;
  studentName: string;
  studentEmail: string;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
  flagCount: number;
  criticalCount: number;
  autoSubmitted: boolean;
}

export const QuizAttemptsTable = ({ assessmentId, courseCode, totalMarks }: QuizAttemptsTableProps) => {
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    // 1. Enrolled students for this course
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("student_id")
      .eq("course_code", courseCode);

    const studentIds = (enrollments || []).map((e) => e.student_id);
    if (studentIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    // 2. Profiles for display
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, email")
      .in("id", studentIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // 3. Attempts for this assessment
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("student_id, started_at, completed_at, score")
      .eq("assessment_id", assessmentId);
    const attemptMap = new Map((attempts || []).map((a) => [a.student_id, a]));

    // 4. Proctoring events for this assessment, aggregated client-side
    const { data: events } = await supabase
      .from("quiz_proctoring_events")
      .select("student_id, event_type, severity")
      .eq("assessment_id", assessmentId);

    const flagsByStudent = new Map<string, { flagCount: number; criticalCount: number; autoSubmitted: boolean }>();
    for (const ev of events || []) {
      const cur = flagsByStudent.get(ev.student_id) || {
        flagCount: 0,
        criticalCount: 0,
        autoSubmitted: false,
      };
      if (ev.event_type === "auto_submit") {
        cur.autoSubmitted = true;
      } else {
        cur.flagCount += 1;
        if (ev.severity === "critical") cur.criticalCount += 1;
      }
      flagsByStudent.set(ev.student_id, cur);
    }

    const built: AttemptRow[] = studentIds.map((sid) => {
      const profile = profileMap.get(sid);
      const attempt = attemptMap.get(sid);
      const flags = flagsByStudent.get(sid) || { flagCount: 0, criticalCount: 0, autoSubmitted: false };
      return {
        studentId: sid,
        studentName: profile?.username || "Unknown",
        studentEmail: profile?.email || "",
        startedAt: attempt?.started_at || null,
        completedAt: attempt?.completed_at || null,
        score: attempt?.score ?? null,
        flagCount: flags.flagCount,
        criticalCount: flags.criticalCount,
        autoSubmitted: flags.autoSubmitted,
      };
    });

    // Sort: completed first (by score desc), then in-progress, then not started
    built.sort((a, b) => {
      const aPhase = a.completedAt ? 0 : a.startedAt ? 1 : 2;
      const bPhase = b.completedAt ? 0 : b.startedAt ? 1 : 2;
      if (aPhase !== bPhase) return aPhase - bPhase;
      return (b.score ?? -1) - (a.score ?? -1);
    });

    setRows(built);
    setLoading(false);
  }, [assessmentId, courseCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const completedCount = rows.filter((r) => r.completedAt).length;
  const flaggedCount = rows.filter((r) => r.flagCount > 0).length;
  const scored = rows.filter((r) => r.score !== null).map((r) => r.score as number);
  const avg = scored.length ? (scored.reduce((s, v) => s + v, 0) / scored.length).toFixed(1) : "—";

  const formatDuration = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (mins < 1) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-sm">Online Quiz Attempts</h4>
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{rows.length} completed
          </Badge>
          <Badge variant="outline" className="text-xs">
            Avg: {avg}/{totalMarks}
          </Badge>
          {flaggedCount > 0 && (
            <Badge className="text-xs gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              {flaggedCount} flagged
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="gap-1 rounded-xl h-8 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[110px]">Score</TableHead>
              <TableHead className="w-[100px]">Duration</TableHead>
              <TableHead className="w-[160px]">Integrity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                  Loading attempts…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                  No students enrolled in {courseCode}.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, i) => {
                const pct = r.score !== null && totalMarks > 0 ? Math.round((r.score / totalMarks) * 100) : null;
                const status = r.completedAt ? "completed" : r.startedAt ? "in_progress" : "not_started";
                return (
                  <TableRow key={r.studentId}>
                    <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{r.studentName}</div>
                      <div className="text-xs text-muted-foreground">{r.studentEmail}</div>
                    </TableCell>
                    <TableCell>
                      {status === "completed" && (
                        <Badge className="text-xs gap-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-0">
                          <CheckCircle2 className="w-3 h-3" />
                          {r.autoSubmitted ? "Auto-submitted" : "Completed"}
                        </Badge>
                      )}
                      {status === "in_progress" && (
                        <Badge className="text-xs gap-1 bg-blue-500/20 text-blue-700 dark:text-blue-400 border-0">
                          <Clock className="w-3 h-3" />
                          In progress
                        </Badge>
                      )}
                      {status === "not_started" && (
                        <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                          <MinusCircle className="w-3 h-3" />
                          Not started
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.score !== null ? (
                        <div className="text-sm">
                          <span className="font-semibold">{r.score}</span>
                          <span className="text-muted-foreground">/{totalMarks}</span>
                          {pct !== null && (
                            <span className="text-xs text-muted-foreground ml-1.5">({pct}%)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.startedAt && r.completedAt ? formatDuration(r.startedAt, r.completedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      {r.flagCount === 0 && r.completedAt ? (
                        <Badge className="text-xs gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">
                          <ShieldCheck className="w-3 h-3" />
                          Clean
                        </Badge>
                      ) : r.flagCount > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 gap-1 text-xs rounded-lg ${
                            r.criticalCount > 0 || r.autoSubmitted
                              ? "text-red-600 dark:text-red-400 hover:bg-red-500/10"
                              : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          }`}
                          onClick={() => {
                            setActiveStudent({ id: r.studentId, name: r.studentName });
                            setEventsOpen(true);
                          }}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {r.flagCount} flag{r.flagCount === 1 ? "" : "s"}
                          {r.criticalCount > 0 && ` (${r.criticalCount} critical)`}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {activeStudent && (
        <ProctoringEventsDialog
          open={eventsOpen}
          onOpenChange={setEventsOpen}
          assessmentId={assessmentId}
          studentId={activeStudent.id}
          studentName={activeStudent.name}
        />
      )}
    </div>
  );
};
