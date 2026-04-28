import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ClipboardList,
  CalendarClock,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Loader2,
  Wifi,
  RefreshCw,
  Eye,
  Hourglass,
} from "lucide-react";

interface AssignmentRow {
  id: string;
  title: string;
  course_code: string;
  course_name: string;
  total_marks: number;
  schedule_end: string | null;
  schedule_start: string | null;
  is_online_quiz: boolean;
  is_marks_finalized: boolean;
  file_path: string | null;
  created_at: string;
}

interface SubmissionRow {
  id: string;
  assessment_id: string;
  submission_file_path: string | null;
  submitted_at: string | null;
  is_late: boolean;
  marks_obtained: number | null;
  remarks: string | null;
}

type Status = "graded" | "submitted-late" | "submitted" | "overdue" | "due-soon" | "due" | "closed" | "online";

const ASSESSMENTS_BUCKET = "assessments";
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB
const ACCEPTED_EXTS = [".pdf", ".doc", ".docx", ".zip", ".txt", ".md", ".rtf", ".png", ".jpg", ".jpeg"];

const formatDeadline = (iso: string | null) => {
  if (!iso) return "No deadline";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor(diffMs / 3600000);
  const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timeLabel = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (diffMs < 0) {
    const lateBy = Math.abs(diffDays);
    if (lateBy === 0) return `Overdue ${Math.abs(diffHours)}h — ${dateLabel}`;
    return `Overdue ${lateBy}d — ${dateLabel}`;
  }
  if (diffDays === 0) return `Due in ${diffHours}h — ${timeLabel}`;
  if (diffDays === 1) return `Due tomorrow — ${dateLabel}`;
  if (diffDays < 7) return `Due in ${diffDays}d — ${dateLabel}`;
  return `Due ${dateLabel}`;
};

const getStatus = (a: AssignmentRow, sub: SubmissionRow | undefined): Status => {
  const graded = sub?.marks_obtained != null;
  if (graded) return "graded";
  if (sub?.submission_file_path) return sub.is_late ? "submitted-late" : "submitted";
  if (a.is_marks_finalized) return "closed";
  if (a.is_online_quiz) return "online";
  if (!a.schedule_end) return "due";
  const now = new Date();
  const end = new Date(a.schedule_end);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs < 0) return "overdue";
  if (diffMs < 24 * 3600 * 1000) return "due-soon";
  return "due";
};

const StudentAssignments = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SubmissionRow>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

    if (codes.length === 0) {
      setAssignments([]);
      setSubmissions({});
      setLoading(false);
      return;
    }

    const { data: aData, error: aErr } = await supabase
      .from("assessments")
      .select("id, title, course_code, course_name, total_marks, schedule_start, schedule_end, is_online_quiz, is_marks_finalized, file_path, created_at")
      .eq("assessment_type", "assignment")
      .in("course_code", codes)
      .order("schedule_end", { ascending: true, nullsFirst: false });

    if (aErr) {
      toast.error("Couldn't load assignments");
      setLoading(false);
      return;
    }

    const aList = (aData ?? []) as AssignmentRow[];
    setAssignments(aList);

    if (aList.length > 0) {
      const { data: sData } = await supabase
        .from("student_marks")
        .select("id, assessment_id, submission_file_path, submitted_at, is_late, marks_obtained, remarks")
        .eq("student_id", user.id)
        .in("assessment_id", aList.map((a) => a.id));

      const subMap: Record<string, SubmissionRow> = {};
      (sData ?? []).forEach((s) => {
        subMap[s.assessment_id] = s as SubmissionRow;
      });
      setSubmissions(subMap);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getFileUrl = (path: string) => {
    return supabase.storage.from(ASSESSMENTS_BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const handleFile = async (assignment: AssignmentRow, file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`File too large. Max ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)}MB`);
      return;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      toast.error(`Unsupported file type. Allowed: ${ACCEPTED_EXTS.join(", ")}`);
      return;
    }

    setUploadingId(assignment.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not signed in");
      setUploadingId(null);
      return;
    }

    // Storage RLS requires the first folder segment to be 'submissions'.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `submissions/${user.id}/${assignment.id}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from(ASSESSMENTS_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (upErr) {
      toast.error(`Upload failed: ${upErr.message}`);
      setUploadingId(null);
      return;
    }

    const { data: rpcData, error: rpcErr } = await supabase.rpc("submit_assignment", {
      p_assessment_id: assignment.id,
      p_file_path: path,
    });

    if (rpcErr) {
      toast.error(`Submission failed: ${rpcErr.message}`);
      // best-effort cleanup of orphaned upload
      await supabase.storage.from(ASSESSMENTS_BUCKET).remove([path]);
      setUploadingId(null);
      return;
    }

    const row = rpcData as unknown as SubmissionRow;
    setSubmissions((prev) => ({ ...prev, [assignment.id]: row }));
    toast.success(row.is_late ? "Submitted (late)" : "Submitted");
    setUploadingId(null);
  };

  const triggerFileInput = (id: string) => {
    fileInputRefs.current[id]?.click();
  };

  const stats = (() => {
    let due = 0;
    let submitted = 0;
    let graded = 0;
    let late = 0;
    for (const a of assignments) {
      const s = submissions[a.id];
      if (s?.marks_obtained != null) {
        graded += 1;
        continue;
      }
      if (s?.submission_file_path) {
        submitted += 1;
        if (s.is_late) late += 1;
        continue;
      }
      due += 1;
    }
    return { due, submitted, graded, late };
  })();

  const filterFor = (tab: string) => {
    return assignments.filter((a) => {
      const s = submissions[a.id];
      const status = getStatus(a, s);
      if (tab === "all") return true;
      if (tab === "due") return status === "due" || status === "due-soon" || status === "overdue" || status === "online";
      if (tab === "submitted") return status === "submitted" || status === "submitted-late";
      if (tab === "graded") return status === "graded";
      return true;
    });
  };

  return (
    <Layout>
      <DecorativeBackground />

      <div className="relative z-10 max-w-6xl mx-auto p-6 md:p-10 space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80 font-medium">
                Submission inbox
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-1">Assignments</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                Briefs from your enrolled courses. Upload your work before the deadline — late submissions are flagged
                but still accepted unless the instructor closes grading.
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
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile
              icon={<Hourglass className="w-4 h-4" />}
              label="Due"
              value={stats.due}
              tone="amber"
            />
            <StatTile
              icon={<Upload className="w-4 h-4" />}
              label="Submitted"
              value={stats.submitted}
              tone="blue"
              footer={stats.late ? `${stats.late} late` : undefined}
            />
            <StatTile
              icon={<Trophy className="w-4 h-4" />}
              label="Graded"
              value={stats.graded}
              tone="emerald"
            />
            <StatTile
              icon={<ClipboardList className="w-4 h-4" />}
              label="Total"
              value={assignments.length}
              tone="neutral"
            />
          </div>
        </header>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState />
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-muted/50 backdrop-blur rounded-xl">
              <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
              <TabsTrigger value="due" className="rounded-lg gap-1.5">
                Due
                {stats.due > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    {stats.due}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="submitted" className="rounded-lg">Submitted</TabsTrigger>
              <TabsTrigger value="graded" className="rounded-lg">Graded</TabsTrigger>
            </TabsList>

            {(["all", "due", "submitted", "graded"] as const).map((tab) => {
              const items = filterFor(tab);
              return (
                <TabsContent key={tab} value={tab} className="space-y-4 mt-0">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Nothing in this view.
                    </p>
                  ) : (
                    items.map((a) => (
                      <AssignmentCard
                        key={a.id}
                        assignment={a}
                        submission={submissions[a.id]}
                        uploading={uploadingId === a.id}
                        getFileUrl={getFileUrl}
                        onUploadClick={() => triggerFileInput(a.id)}
                        registerRef={(el) => (fileInputRefs.current[a.id] = el)}
                        onFile={(file) => handleFile(a, file)}
                      />
                    ))
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

/* ────────────────────────────────────────────────────────────── */

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "amber" | "blue" | "emerald" | "neutral";
  footer?: string;
}

const toneClasses: Record<StatTileProps["tone"], string> = {
  amber: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  neutral: "bg-muted/40 border-border/60 text-foreground",
};

const StatTile = ({ icon, label, value, tone, footer }: StatTileProps) => (
  <div className={`rounded-xl border backdrop-blur p-3 ${toneClasses[tone]}`}>
    <div className="flex items-center gap-2 text-xs font-medium opacity-90">
      {icon}
      {label}
    </div>
    <div className="text-2xl font-bold mt-1">{value}</div>
    {footer && <div className="text-xs opacity-70 mt-0.5">{footer}</div>}
  </div>
);

/* ────────────────────────────────────────────────────────────── */

interface AssignmentCardProps {
  assignment: AssignmentRow;
  submission: SubmissionRow | undefined;
  uploading: boolean;
  getFileUrl: (path: string) => string;
  onUploadClick: () => void;
  registerRef: (el: HTMLInputElement | null) => void;
  onFile: (file: File) => void;
}

const AssignmentCard = ({
  assignment: a,
  submission: s,
  uploading,
  getFileUrl,
  onUploadClick,
  registerRef,
  onFile,
}: AssignmentCardProps) => {
  const status = getStatus(a, s);
  const deadlinePassed = a.schedule_end ? new Date(a.schedule_end) < new Date() : false;
  const graded = s?.marks_obtained != null;
  const submitted = !!s?.submission_file_path;
  const totalMarks = a.total_marks;
  const earned = s?.marks_obtained ?? null;
  const pct = earned != null ? Math.round((earned / totalMarks) * 100) : null;

  return (
    <Card className="backdrop-blur border border-border/50 bg-card/80 overflow-hidden">
      <CardContent className="p-0">
        {/* Top row: meta */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-[10px] tracking-wide px-1.5 py-0">
                  {a.course_code}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">{a.course_name}</span>
                {a.is_online_quiz && (
                  <Badge className="text-[10px] gap-1 bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0">
                    <Wifi className="w-3 h-3" /> Online
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold leading-tight">{a.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="w-3.5 h-3.5" />
                <span className={deadlinePassed && !submitted ? "text-amber-700 dark:text-amber-400 font-medium" : ""}>
                  {formatDeadline(a.schedule_end)}
                </span>
                <span className="opacity-50">·</span>
                <span>{totalMarks} marks</span>
              </div>
            </div>

            <StatusPill status={status} />
          </div>

          {/* Brief */}
          {a.file_path && (
            <a
              href={getFileUrl(a.file_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Download className="w-4 h-4" />
              Download brief
            </a>
          )}

          {/* Online-mode notice */}
          {a.is_online_quiz && !submitted && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-blue-700 dark:text-blue-300">
              This is an in-browser submission. Open the <span className="font-semibold">Quizzes</span> page to answer
              the questions — file uploads are not used here.
            </div>
          )}
        </div>

        {/* Submission block */}
        {!a.is_online_quiz && (
          <div className="border-t border-border/40 p-5 bg-muted/20">
            {graded ? (
              <GradedBlock
                assignment={a}
                submission={s!}
                pct={pct!}
                getFileUrl={getFileUrl}
              />
            ) : submitted ? (
              <SubmittedBlock
                submission={s!}
                getFileUrl={getFileUrl}
                canReplace={!a.is_marks_finalized}
                uploading={uploading}
                onReplaceClick={onUploadClick}
              />
            ) : a.is_marks_finalized ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4" />
                Submissions closed.
              </div>
            ) : (
              <DropZone
                deadlinePassed={deadlinePassed}
                uploading={uploading}
                onClick={onUploadClick}
                onFile={onFile}
              />
            )}

            <input
              ref={registerRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_EXTS.join(",")}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ────────────────────────────────────────────────────────────── */

const StatusPill = ({ status }: { status: Status }) => {
  const config: Record<Status, { label: string; cls: string; icon: React.ReactNode }> = {
    graded: {
      label: "Graded",
      cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      icon: <Trophy className="w-3 h-3" />,
    },
    "submitted-late": {
      label: "Submitted late",
      cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    submitted: {
      label: "Submitted",
      cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    overdue: {
      label: "Overdue",
      cls: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    "due-soon": {
      label: "Due soon",
      cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      icon: <Hourglass className="w-3 h-3" />,
    },
    due: {
      label: "Open",
      cls: "bg-muted/60 text-foreground/80 border-border/60",
      icon: <Hourglass className="w-3 h-3" />,
    },
    closed: {
      label: "Closed",
      cls: "bg-muted/40 text-muted-foreground border-border/60",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    online: {
      label: "Online",
      cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
      icon: <Wifi className="w-3 h-3" />,
    },
  };
  const c = config[status];
  return (
    <Badge className={`gap-1 border ${c.cls} font-medium text-[11px] px-2 py-1 rounded-lg`}>
      {c.icon}
      {c.label}
    </Badge>
  );
};

/* ────────────────────────────────────────────────────────────── */

interface DropZoneProps {
  deadlinePassed: boolean;
  uploading: boolean;
  onClick: () => void;
  onFile: (f: File) => void;
}

const DropZone = ({ deadlinePassed, uploading, onClick, onFile }: DropZoneProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div className="space-y-3">
      {deadlinePassed && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>The deadline has passed. Your submission will be flagged as late.</span>
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={`w-full rounded-xl border-2 border-dashed p-6 transition-all flex flex-col items-center gap-2 text-center
          ${dragOver ? "border-primary bg-primary/5" : "border-border/60 bg-background/40 hover:border-primary/60 hover:bg-primary/5"}
          ${uploading ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading…</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Drop a file or click to upload</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PDF, DOCX, ZIP, or image · max 25MB
              </p>
            </div>
          </>
        )}
      </button>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────── */

interface SubmittedBlockProps {
  submission: SubmissionRow;
  getFileUrl: (path: string) => string;
  canReplace: boolean;
  uploading: boolean;
  onReplaceClick: () => void;
}

const SubmittedBlock = ({ submission, getFileUrl, canReplace, uploading, onReplaceClick }: SubmittedBlockProps) => {
  const fileName = submission.submission_file_path?.split("/").pop()?.replace(/^\d+-/, "") ?? "submission";
  const submittedAt = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/60 p-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            Submitted {submittedAt}
            {submission.is_late && (
              <span className="ml-1.5 text-amber-700 dark:text-amber-400 font-medium">· late</span>
            )}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-lg gap-1 text-xs">
          <a href={getFileUrl(submission.submission_file_path!)} target="_blank" rel="noopener noreferrer">
            <Eye className="w-3.5 h-3.5" />
            View
          </a>
        </Button>
      </div>
      {canReplace && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReplaceClick}
          disabled={uploading}
          className="rounded-xl gap-2 w-full sm:w-auto"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Replace submission
        </Button>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────── */

interface GradedBlockProps {
  assignment: AssignmentRow;
  submission: SubmissionRow;
  pct: number;
  getFileUrl: (path: string) => string;
}

const GradedBlock = ({ assignment, submission, pct, getFileUrl }: GradedBlockProps) => {
  const earned = submission.marks_obtained ?? 0;
  const total = assignment.total_marks;

  const tone =
    pct >= 80 ? "emerald" : pct >= 60 ? "blue" : pct >= 40 ? "amber" : "rose";
  const toneText: Record<typeof tone, string> = {
    emerald: "text-emerald-700 dark:text-emerald-400",
    blue: "text-blue-700 dark:text-blue-400",
    amber: "text-amber-700 dark:text-amber-400",
    rose: "text-rose-700 dark:text-rose-400",
  };
  const toneBar: Record<typeof tone, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3 flex-wrap">
        <div>
          <span className={`text-3xl font-bold ${toneText[tone]}`}>{earned}</span>
          <span className="text-sm text-muted-foreground"> / {total}</span>
        </div>
        <span className={`text-sm font-semibold ${toneText[tone]}`}>{pct}%</span>
        {submission.is_late && (
          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-400">
            late
          </Badge>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <div className={`h-full ${toneBar[tone]} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      {submission.remarks && (
        <p className="text-xs text-muted-foreground italic">"{submission.remarks}"</p>
      )}
      {submission.submission_file_path && (
        <Button asChild variant="ghost" size="sm" className="rounded-lg gap-1 text-xs h-7 px-2 -ml-2">
          <a href={getFileUrl(submission.submission_file_path)} target="_blank" rel="noopener noreferrer">
            <Eye className="w-3.5 h-3.5" />
            View your submission
          </a>
        </Button>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────── */

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 backdrop-blur p-16 text-center space-y-3">
    <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto">
      <ClipboardList className="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold">No assignments yet</h3>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
      You're either between briefs, or your courses haven't posted any yet. Check back soon.
    </p>
  </div>
);

export default StudentAssignments;
