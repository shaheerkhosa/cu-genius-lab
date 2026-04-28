import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, Loader2, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";

interface TimetableRow {
  id: string;
  course_code: string;
  course_name: string;
  day_of_week: number;
  start_time: string; // HH:MM:SS
  end_time: string;
  room: string | null;
  teacher_id: string | null;
}

interface CourseRow {
  course_code: string;
  course_name: string;
}

interface ConflictRow {
  student_id: string;
  student_name: string;
  student_email: string;
  conflicting_course_code: string;
  conflicting_course_name: string;
  conflicting_start: string;
  conflicting_end: string;
  conflicting_room: string | null;
}

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const dayLabel = (n: number) => DAYS.find((d) => d.value === n)?.label ?? "";
const fmtTime = (t: string) => t.slice(0, 5); // HH:MM

type EditorState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; row: TimetableRow };

const AdminTimetable = () => {
  const [rows, setRows] = useState<TimetableRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });

  const fetchAll = async () => {
    setLoading(true);
    const [rRes, cRes] = await Promise.all([
      supabase
        .from("timetable")
        .select("id,course_code,course_name,day_of_week,start_time,end_time,room,teacher_id")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase
        .from("courses")
        .select("course_code,course_name")
        .order("course_code", { ascending: true }),
    ]);
    if (rRes.error) toast.error(rRes.error.message);
    if (cRes.error) toast.error(cRes.error.message);
    setRows((rRes.data ?? []) as TimetableRow[]);
    setCourses((cRes.data ?? []) as CourseRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<number, TimetableRow[]>();
    for (const r of rows) {
      const list = map.get(r.day_of_week) ?? [];
      list.push(r);
      map.set(r.day_of_week, list);
    }
    return Array.from(map.entries()).sort((a, b) => {
      // Show Mon-Sat first, Sunday last (most schedules don't include Sunday).
      const score = (n: number) => (n === 0 ? 7 : n);
      return score(a[0]) - score(b[0]);
    });
  }, [rows]);

  const remove = async (row: TimetableRow) => {
    if (!confirm(`Delete ${row.course_code} ${dayLabel(row.day_of_week)} ${fmtTime(row.start_time)}?`)) return;
    const { error } = await supabase.from("timetable").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Slot deleted");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    }
  };

  return (
    <AdminLayout>
      <DecorativeBackground />
      <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-10 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Timetable</h1>
              <p className="text-sm text-muted-foreground">
                Manage class slots. Conflicts are detected against students enrolled in multiple
                overlapping courses.
              </p>
            </div>
          </div>
          <Button onClick={() => setEditor({ mode: "create" })}>
            <Plus className="h-4 w-4 mr-1" /> Add slot
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading schedule…
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No slots yet. Add one above.
            </CardContent>
          </Card>
        ) : (
          grouped.map(([day, list]) => (
            <Card key={day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{dayLabel(day)}</CardTitle>
                <CardDescription>{list.length} slot{list.length === 1 ? "" : "s"}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {list.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                        {row.course_code}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{row.course_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {fmtTime(row.start_time)} – {fmtTime(row.end_time)}
                          {row.room ? ` · ${row.room}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditor({ mode: "edit", row })}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(row)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <SlotEditor
        state={editor}
        courses={courses}
        onClose={() => setEditor({ mode: "closed" })}
        onSaved={async () => {
          setEditor({ mode: "closed" });
          await fetchAll();
        }}
      />
    </AdminLayout>
  );
};

/* ─── editor ─────────────────────────────────────────────────────────── */

function SlotEditor({
  state,
  courses,
  onClose,
  onSaved,
}: {
  state: EditorState;
  courses: CourseRow[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const isOpen = state.mode !== "closed";
  const editing = state.mode === "edit" ? state.row : null;

  const [courseCode, setCourseCode] = useState("");
  const [day, setDay] = useState<number>(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [room, setRoom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictRow[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setCourseCode(editing.course_code);
      setDay(editing.day_of_week);
      setStart(fmtTime(editing.start_time));
      setEnd(fmtTime(editing.end_time));
      setRoom(editing.room ?? "");
    } else {
      setCourseCode(courses[0]?.course_code ?? "");
      setDay(1);
      setStart("09:00");
      setEnd("10:00");
      setRoom("");
    }
    setConflicts(null);
  }, [isOpen, editing, courses]);

  const validate = () => {
    if (!courseCode) return "Pick a course.";
    if (!start || !end) return "Start and end times are required.";
    if (start >= end) return "End time must be after start time.";
    return null;
  };

  // ── conflict check + save flow ─────────────────────────────────────────
  const attemptSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      // 1. Run conflict detection. If anything comes back, surface it to the
      //    admin and require an explicit override before persisting.
      const { data, error } = await supabase.rpc("find_timetable_conflicts", {
        p_course_code: courseCode,
        p_day_of_week: day,
        p_start_time: `${start}:00`,
        p_end_time: `${end}:00`,
        p_exclude_id: editing?.id ?? null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      const list = (data ?? []) as ConflictRow[];
      if (list.length > 0) {
        setConflicts(list);
        return; // Wait for admin to confirm or cancel.
      }
      await persist();
    } finally {
      setSubmitting(false);
    }
  };

  const persist = async () => {
    setSubmitting(true);
    try {
      const course = courses.find((c) => c.course_code === courseCode);
      const payload = {
        course_code: courseCode,
        course_name: course?.course_name ?? courseCode,
        day_of_week: day,
        start_time: `${start}:00`,
        end_time: `${end}:00`,
        room: room.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("timetable").update(payload).eq("id", editing.id);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Slot updated");
      } else {
        const { error } = await supabase.from("timetable").insert(payload);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Slot added");
      }
      await onSaved();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit slot" : "Add slot"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the time, room, or course for this class slot."
              : "Schedule a recurring weekly class slot."}
          </DialogDescription>
        </DialogHeader>

        {conflicts === null ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Select value={courseCode} onValueChange={setCourseCode} disabled={submitting}>
                <SelectTrigger id="course"><SelectValue placeholder="Pick a course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.course_code} value={c.course_code}>
                      <span className="font-mono mr-2">{c.course_code}</span>
                      {c.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2 col-span-3 sm:col-span-1">
                <Label htmlFor="day">Day</Label>
                <Select value={String(day)} onValueChange={(v) => setDay(Number(v))} disabled={submitting}>
                  <SelectTrigger id="day"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-3 sm:col-span-1">
                <Label htmlFor="start">Start</Label>
                <Input id="start" type="time" value={start} onChange={(e) => setStart(e.target.value)} disabled={submitting} />
              </div>
              <div className="space-y-2 col-span-3 sm:col-span-1">
                <Label htmlFor="end">End</Label>
                <Input id="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} disabled={submitting} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room (optional)</Label>
              <Input id="room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Room 301 / Online" disabled={submitting} />
            </div>
          </div>
        ) : (
          <ConflictPanel conflicts={conflicts} />
        )}

        <DialogFooter className="flex-row sm:justify-between gap-2">
          {conflicts === null ? (
            <>
              <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button onClick={attemptSave} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Save changes" : "Add slot"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setConflicts(null)} disabled={submitting}>Edit slot</Button>
              <Button variant="destructive" onClick={persist} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Override and save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConflictPanel({ conflicts }: { conflicts: ConflictRow[] }) {
  // Group by student so the admin sees one entry per affected person.
  const byStudent = new Map<string, ConflictRow[]>();
  for (const c of conflicts) {
    const list = byStudent.get(c.student_id) ?? [];
    list.push(c);
    byStudent.set(c.student_id, list);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-amber-700 dark:text-amber-300">
            {byStudent.size} student{byStudent.size === 1 ? " has" : "s have"} a clash
          </p>
          <p className="text-muted-foreground">
            They're enrolled in another course whose existing slot overlaps with the proposed time.
            You can override and save anyway.
          </p>
        </div>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {Array.from(byStudent.entries()).map(([sid, items]) => (
          <Card key={sid}>
            <CardContent className="py-3">
              <div className="text-sm font-medium">
                {items[0].student_name || items[0].student_email}
                <span className="text-xs text-muted-foreground ml-2">{items[0].student_email}</span>
              </div>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {items.map((c, i) => (
                  <li key={i}>
                    Already in <span className="font-mono">{c.conflicting_course_code}</span>{" "}
                    {c.conflicting_course_name}{" "}
                    ({fmtTime(c.conflicting_start)}–{fmtTime(c.conflicting_end)}
                    {c.conflicting_room ? `, ${c.conflicting_room}` : ""})
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminTimetable;
