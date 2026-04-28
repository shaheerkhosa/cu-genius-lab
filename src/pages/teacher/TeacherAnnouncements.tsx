import { useState, useEffect, useCallback, useMemo } from "react";
import { TeacherLayout } from "@/components/TeacherLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Megaphone,
  Send,
  Trash2,
  Pencil,
  Loader2,
  Flame,
  AlertTriangle,
  X,
  Check,
  RefreshCw,
} from "lucide-react";

type Priority = "normal" | "important" | "urgent";

interface TeacherCourse {
  course_code: string;
  course_name: string;
}

interface Announcement {
  id: string;
  course_code: string;
  teacher_id: string;
  title: string;
  body: string;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

const TITLE_MAX = 120;
const BODY_MAX = 4000;

const TeacherAnnouncements = () => {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("normal");
  const [savingEdit, setSavingEdit] = useState(false);

  /* ─── data fetching ───────────────────────────────────────── */

  const fetchCourses = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setTeacherId(user.id);

    const { data: courseData } = await supabase
      .from("teacher_courses")
      .select("course_code, course_name")
      .eq("teacher_id", user.id)
      .order("course_code");

    setCourses(courseData ?? []);
    if (courseData && courseData.length > 0 && !selectedCourse) {
      setSelectedCourse(courseData[0].course_code);
    }
    setLoading(false);
  }, [selectedCourse]);

  const fetchAnnouncements = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("course_announcements")
      .select("*")
      .eq("teacher_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Couldn't load announcements");
      return;
    }
    setAnnouncements((data ?? []) as Announcement[]);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (teacherId) fetchAnnouncements(teacherId);
  }, [teacherId, fetchAnnouncements]);

  /* ─── post ───────────────────────────────────────────────── */

  const resetForm = () => {
    setTitle("");
    setBody("");
    setPriority("normal");
  };

  const handlePost = async () => {
    if (!teacherId) return;
    if (!selectedCourse) {
      toast.error("Pick a course first");
      return;
    }
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      toast.error("Title and body are required");
      return;
    }
    setPosting(true);
    const { data, error } = await supabase
      .from("course_announcements")
      .insert({
        course_code: selectedCourse,
        teacher_id: teacherId,
        title: trimmedTitle,
        body: trimmedBody,
        priority,
      })
      .select()
      .single();

    if (error) {
      toast.error(`Post failed: ${error.message}`);
      setPosting(false);
      return;
    }
    setAnnouncements((prev) => [data as Announcement, ...prev]);
    toast.success("Announcement posted");
    resetForm();
    setPosting(false);
  };

  /* ─── edit ───────────────────────────────────────────────── */

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditBody(a.body);
    setEditPriority(a.priority);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
    setEditPriority("normal");
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim() || !editBody.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setSavingEdit(true);
    const { data, error } = await supabase
      .from("course_announcements")
      .update({
        title: editTitle.trim(),
        body: editBody.trim(),
        priority: editPriority,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      toast.error(`Update failed: ${error.message}`);
      setSavingEdit(false);
      return;
    }
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? (data as Announcement) : a)));
    toast.success("Announcement updated");
    cancelEdit();
    setSavingEdit(false);
  };

  /* ─── delete ─────────────────────────────────────────────── */

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("course_announcements").delete().eq("id", id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast.success("Announcement deleted");
  };

  /* ─── render ─────────────────────────────────────────────── */

  const courseLabel = useMemo(() => {
    const c = courses.find((c) => c.course_code === selectedCourse);
    return c ? `${c.course_code} — ${c.course_name}` : selectedCourse;
  }, [courses, selectedCourse]);

  const groupedByCourse = useMemo(() => {
    const map: Record<string, Announcement[]> = {};
    for (const a of announcements) {
      (map[a.course_code] ??= []).push(a);
    }
    return map;
  }, [announcements]);

  return (
    <TeacherLayout>
      <DecorativeBackground />
      <div className="relative z-10 max-w-6xl mx-auto p-6 md:p-10 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80 font-medium">
            Broadcast desk
          </p>
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Announcements</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                Post updates to your students. Pick a course, write your message, and pick a priority — pinned to the
                top of their feed for urgent items.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => teacherId && fetchAnnouncements(teacherId)}
              disabled={loading}
              className="rounded-xl gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : courses.length === 0 ? (
          <NoCoursesState />
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)] gap-6">
            {/* Composer */}
            <Card className="backdrop-blur border border-border/50 bg-card/80 lg:sticky lg:top-6 self-start">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">Compose</h2>
                    <p className="text-xs text-muted-foreground">Post to one course at a time.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Pick a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.course_code} value={c.course_code}>
                          <span className="font-mono text-xs mr-2">{c.course_code}</span>
                          {c.course_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Title</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {title.length}/{TITLE_MAX}
                    </span>
                  </div>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                    placeholder="e.g. Quiz 2 postponed"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Message</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {body.length}/{BODY_MAX}
                    </span>
                  </div>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                    placeholder="Write your message…"
                    rows={6}
                    className="rounded-xl resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
                  <PrioritySelector value={priority} onChange={setPriority} />
                </div>

                <Button
                  onClick={handlePost}
                  disabled={posting || !title.trim() || !body.trim() || !selectedCourse}
                  size="lg"
                  className="w-full rounded-xl gap-2"
                >
                  {posting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Post to {selectedCourse || "—"}
                </Button>
              </CardContent>
            </Card>

            {/* Feed */}
            <div className="space-y-6">
              {announcements.length === 0 ? (
                <EmptyFeedState />
              ) : (
                Object.entries(groupedByCourse).map(([code, items]) => {
                  const courseName = courses.find((c) => c.course_code === code)?.course_name ?? "";
                  return (
                    <section key={code} className="space-y-3">
                      <div className="flex items-baseline gap-2 px-1">
                        <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                          {code}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">{courseName}</span>
                        <span className="text-[10px] text-muted-foreground/70 ml-auto">
                          {items.length} {items.length === 1 ? "post" : "posts"}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {items.map((a) => (
                          <AnnouncementRow
                            key={a.id}
                            announcement={a}
                            isEditing={editingId === a.id}
                            editTitle={editTitle}
                            editBody={editBody}
                            editPriority={editPriority}
                            savingEdit={savingEdit}
                            onStartEdit={() => startEdit(a)}
                            onCancelEdit={cancelEdit}
                            onSaveEdit={() => saveEdit(a.id)}
                            onDelete={() => handleDelete(a.id)}
                            setEditTitle={setEditTitle}
                            setEditBody={setEditBody}
                            setEditPriority={setEditPriority}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

/* ─── helper components ────────────────────────────────────── */

const PRIORITY_META: Record<Priority, { label: string; icon: React.ReactNode; cls: string; activeCls: string }> = {
  normal: {
    label: "Normal",
    icon: <Megaphone className="w-3.5 h-3.5" />,
    cls: "border-border/60 text-muted-foreground hover:text-foreground",
    activeCls: "bg-primary/10 border-primary/40 text-primary",
  },
  important: {
    label: "Important",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    cls: "border-border/60 text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400",
    activeCls: "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-400",
  },
  urgent: {
    label: "Urgent",
    icon: <Flame className="w-3.5 h-3.5" />,
    cls: "border-border/60 text-muted-foreground hover:text-rose-700 dark:hover:text-rose-400",
    activeCls: "bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-400",
  },
};

const PrioritySelector = ({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) => (
  <div className="grid grid-cols-3 gap-2">
    {(Object.keys(PRIORITY_META) as Priority[]).map((p) => {
      const m = PRIORITY_META[p];
      const active = value === p;
      return (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
            active ? m.activeCls : m.cls + " bg-background/40"
          }`}
        >
          {m.icon}
          {m.label}
        </button>
      );
    })}
  </div>
);

interface AnnouncementRowProps {
  announcement: Announcement;
  isEditing: boolean;
  editTitle: string;
  editBody: string;
  editPriority: Priority;
  savingEdit: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  setEditTitle: (v: string) => void;
  setEditBody: (v: string) => void;
  setEditPriority: (p: Priority) => void;
}

const AnnouncementRow = ({
  announcement: a,
  isEditing,
  editTitle,
  editBody,
  editPriority,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  setEditTitle,
  setEditBody,
  setEditPriority,
}: AnnouncementRowProps) => {
  const stripCls =
    a.priority === "urgent"
      ? "bg-rose-500"
      : a.priority === "important"
      ? "bg-amber-500"
      : "bg-primary/40";
  const created = new Date(a.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const edited = a.updated_at !== a.created_at;

  if (isEditing) {
    return (
      <Card className="backdrop-blur border border-primary/40 bg-card/90">
        <CardContent className="p-4 space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value.slice(0, TITLE_MAX))}
            className="rounded-xl"
          />
          <Textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value.slice(0, BODY_MAX))}
            rows={5}
            className="rounded-xl resize-none"
          />
          <PrioritySelector value={editPriority} onChange={setEditPriority} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={savingEdit} className="rounded-xl gap-1">
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button size="sm" onClick={onSaveEdit} disabled={savingEdit} className="rounded-xl gap-1">
              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur border border-border/50 bg-card/80 overflow-hidden group">
      <CardContent className="p-0 flex">
        <div className={`w-1 ${stripCls}`} aria-hidden />
        <div className="flex-1 p-4 space-y-2 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {a.priority !== "normal" && (
                  <Badge
                    className={`gap-1 text-[10px] px-1.5 py-0 border ${
                      a.priority === "urgent"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40"
                    }`}
                  >
                    {a.priority === "urgent" ? <Flame className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {a.priority}
                  </Badge>
                )}
                <h3 className="font-semibold text-sm leading-snug truncate">{a.title}</h3>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {created}
                {edited && <span className="ml-1 italic">· edited</span>}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={onStartEdit}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This is permanent. Students will no longer see "{a.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">{a.body}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const NoCoursesState = () => (
  <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 backdrop-blur p-16 text-center space-y-3">
    <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto">
      <Megaphone className="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold">No courses assigned</h3>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
      You need to be teaching at least one course before you can post announcements.
    </p>
  </div>
);

const EmptyFeedState = () => (
  <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 backdrop-blur p-12 text-center space-y-2">
    <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto">
      <Megaphone className="w-5 h-5 text-muted-foreground" />
    </div>
    <h3 className="font-semibold">No announcements yet</h3>
    <p className="text-sm text-muted-foreground">Post your first one — students will see it instantly.</p>
  </div>
);

export default TeacherAnnouncements;
