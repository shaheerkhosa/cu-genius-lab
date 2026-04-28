import { useState, useEffect, useCallback, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Megaphone,
  Flame,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Inbox,
  Pin,
} from "lucide-react";

type Priority = "normal" | "important" | "urgent";

interface Announcement {
  id: string;
  // For 'course' announcements: course_code is set, audience_* is undefined.
  // For 'admin' announcements: course_code is undefined, audience_* is set.
  source: "course" | "admin";
  course_code?: string;
  teacher_id?: string;
  audience_type?: "all" | "batch";
  audience_value?: number | null;
  title: string;
  body: string;
  priority: Priority;
  created_at: string;
  updated_at?: string;
}

interface CourseMeta {
  course_code: string;
  course_name: string;
}

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, important: 1, normal: 2 };

const formatRelative = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  const hr = Math.floor(diffMs / 3600000);
  const day = Math.floor(diffMs / 86400000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const StudentAnnouncements = () => {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courseMeta, setCourseMeta] = useState<Record<string, string>>({});
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [unseenAt, setUnseenAt] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Course names for the labels
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

    // Fetch course-scoped announcements (from teachers) and admin
    // broadcasts in parallel. RLS scopes both: course rows are limited to
    // courses the student is enrolled in; admin rows to 'all' or matching
    // batch year.
    const [courseRes, adminRes] = await Promise.all([
      supabase
        .from("course_announcements")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("student_announcements")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (courseRes.error || adminRes.error) {
      toast.error("Couldn't load announcements");
      setLoading(false);
      return;
    }

    const merged: Announcement[] = [
      ...((courseRes.data ?? []).map((row) => ({
        ...(row as Record<string, unknown>),
        source: "course" as const,
      })) as Announcement[]),
      ...((adminRes.data ?? []).map((row) => ({
        ...(row as Record<string, unknown>),
        source: "admin" as const,
      })) as Announcement[]),
    ];

    setAnnouncements(merged);

    // Track "last seen" per user in localStorage so we can highlight new posts.
    const key = `announcements_seen_${user.id}`;
    const previous = localStorage.getItem(key);
    setUnseenAt(previous ? new Date(previous) : null);
    localStorage.setItem(key, new Date().toISOString());

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sorted = useMemo(() => {
    const filtered =
      filterCourse === "all"
        ? announcements
        : filterCourse === "admin"
          ? announcements.filter((a) => a.source === "admin")
          : announcements.filter((a) => a.course_code === filterCourse);
    return [...filtered].sort((a, b) => {
      const r = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (r !== 0) return r;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [announcements, filterCourse]);

  const courseCodes = useMemo(() => {
    const set = new Set(
      announcements
        .map((a) => a.course_code)
        .filter((c): c is string => typeof c === "string"),
    );
    return Array.from(set).sort();
  }, [announcements]);

  const hasAdminBroadcasts = useMemo(
    () => announcements.some((a) => a.source === "admin"),
    [announcements],
  );

  const stats = useMemo(() => {
    const urgent = announcements.filter((a) => a.priority === "urgent").length;
    const important = announcements.filter((a) => a.priority === "important").length;
    const fresh = unseenAt
      ? announcements.filter((a) => new Date(a.created_at) > unseenAt).length
      : 0;
    return { urgent, important, fresh };
  }, [announcements, unseenAt]);

  return (
    <Layout>
      <DecorativeBackground />
      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-10 space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80 font-medium">
                From your instructors
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-1">Announcements</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                Updates from courses you're enrolled in. Urgent items are pinned to the top.
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

          {/* Banner stats */}
          {!loading && announcements.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {stats.fresh > 0 && (
                <Badge className="gap-1.5 bg-primary/15 text-primary border border-primary/30 rounded-lg">
                  <Pin className="w-3 h-3" />
                  {stats.fresh} new since last visit
                </Badge>
              )}
              {stats.urgent > 0 && (
                <Badge className="gap-1.5 bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-lg">
                  <Flame className="w-3 h-3" />
                  {stats.urgent} urgent
                </Badge>
              )}
              {stats.important > 0 && (
                <Badge className="gap-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.important} important
                </Badge>
              )}
            </div>
          )}

          {/* Course / source filter */}
          {(courseCodes.length > 1 || hasAdminBroadcasts) && (
            <ToggleGroup
              type="single"
              value={filterCourse}
              onValueChange={(v) => v && setFilterCourse(v)}
              className="flex-wrap justify-start gap-1.5"
            >
              <ToggleGroupItem value="all" className="rounded-lg text-xs h-8 px-3 data-[state=on]:bg-primary/15 data-[state=on]:text-primary">
                All
              </ToggleGroupItem>
              {hasAdminBroadcasts && (
                <ToggleGroupItem
                  value="admin"
                  className="rounded-lg text-xs h-8 px-3 data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
                >
                  Admin
                </ToggleGroupItem>
              )}
              {courseCodes.map((code) => (
                <ToggleGroupItem
                  key={code}
                  value={code}
                  className="rounded-lg text-xs h-8 px-3 font-mono data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
                >
                  {code}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </header>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState filtered={filterCourse !== "all"} />
        ) : (
          <div className="space-y-3">
            {sorted.map((a) => (
              <AnnouncementCard
                key={`${a.source}-${a.id}`}
                announcement={a}
                courseName={a.course_code ? (courseMeta[a.course_code] ?? "") : ""}
                isFresh={!!unseenAt && new Date(a.created_at) > unseenAt}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

/* ─── card ────────────────────────────────────────────────── */

const AnnouncementCard = ({
  announcement: a,
  courseName,
  isFresh,
}: {
  announcement: Announcement;
  courseName: string;
  isFresh: boolean;
}) => {
  const stripCls =
    a.priority === "urgent"
      ? "bg-rose-500"
      : a.priority === "important"
      ? "bg-amber-500"
      : "bg-primary/40";
  const priorityBadge =
    a.priority === "urgent" ? (
      <Badge className="gap-1 text-[10px] px-1.5 py-0 border bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40">
        <Flame className="w-3 h-3" /> urgent
      </Badge>
    ) : a.priority === "important" ? (
      <Badge className="gap-1 text-[10px] px-1.5 py-0 border bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40">
        <AlertTriangle className="w-3 h-3" /> important
      </Badge>
    ) : null;

  return (
    <Card className={`backdrop-blur border bg-card/80 overflow-hidden ${isFresh ? "border-primary/40 shadow-sm shadow-primary/10" : "border-border/50"}`}>
      <CardContent className="p-0 flex">
        <div className={`w-1 ${stripCls}`} aria-hidden />
        <div className="flex-1 p-4 md:p-5 space-y-2 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {a.source === "admin" ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                    {a.audience_type === "all" ? "All students" : `Batch ${a.audience_value}`}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                    {a.course_code}
                  </Badge>
                )}
                {a.source === "admin" ? (
                  <span className="text-xs text-muted-foreground truncate">From admin</span>
                ) : (
                  courseName && <span className="text-xs text-muted-foreground truncate">{courseName}</span>
                )}
                {priorityBadge}
                {isFresh && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-0">
                    new
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-base leading-snug">{a.title}</h3>
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {formatRelative(a.created_at)}
            </span>
          </div>
          <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">{a.body}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ filtered }: { filtered: boolean }) => (
  <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 backdrop-blur p-16 text-center space-y-3">
    <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto">
      <Inbox className="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold">{filtered ? "Nothing for this course yet" : "Inbox zero"}</h3>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
      {filtered
        ? "Try another course filter or check back soon."
        : "When your instructors post updates, they'll show up here."}
    </p>
  </div>
);

export default StudentAnnouncements;
