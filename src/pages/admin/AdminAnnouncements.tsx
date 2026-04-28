import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone, Loader2, Trash2, Users, GraduationCap } from "lucide-react";

type Priority = "normal" | "important" | "urgent";

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience_type: "all" | "batch";
  audience_value: number | null;
  priority: Priority;
  created_at: string;
}

const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (min < 1440) return `${Math.floor(min / 60)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const AdminAnnouncements = () => {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [batches, setBatches] = useState<number[]>([]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | string>("all"); // "all" or batch year as string
  const [priority, setPriority] = useState<Priority>("normal");

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("student_announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Couldn't load announcements");
    } else {
      setList((data ?? []) as Announcement[]);
    }
    setLoading(false);
  };

  const fetchBatches = async () => {
    // List of distinct enrollment years to populate the audience dropdown.
    const { data } = await supabase
      .from("profiles")
      .select("enrollment_year");
    const years = Array.from(
      new Set((data ?? []).map((p) => (p as { enrollment_year: number }).enrollment_year)),
    )
      .filter((y) => Number.isInteger(y))
      .sort((a, b) => b - a);
    setBatches(years);
  };

  useEffect(() => {
    fetchAll();
    fetchBatches();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are both required.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not signed in.");
        return;
      }
      const isAll = audience === "all";
      const audienceValue = isAll ? null : Number(audience);
      const { error } = await supabase.from("student_announcements").insert({
        title: title.trim(),
        body: body.trim(),
        audience_type: isAll ? "all" : "batch",
        audience_value: audienceValue,
        priority,
        created_by: user.id,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Announcement sent to ${isAll ? "all students" : `batch ${audienceValue}`}.`);
      setTitle("");
      setBody("");
      setAudience("all");
      setPriority("normal");
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("student_announcements").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted.");
      setList((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const audienceLabel = useMemo(
    () => (a: Announcement) =>
      a.audience_type === "all" ? "All students" : `Batch ${a.audience_value}`,
    [],
  );

  return (
    <AdminLayout>
      <DecorativeBackground />

      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Announcements</h1>
            <p className="text-sm text-muted-foreground">
              Broadcast a message to all students or to a specific batch.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">New announcement</CardTitle>
            <CardDescription>
              Students will see this in their Announcements feed immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spring break schedule"
                  disabled={submitting}
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Markdown is supported."
                  disabled={submitting}
                  required
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audience">Audience</Label>
                  <Select value={audience} onValueChange={setAudience} disabled={submitting}>
                    <SelectTrigger id="audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="inline-flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          All students
                        </span>
                      </SelectItem>
                      {batches.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          <span className="inline-flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Batch {y}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)} disabled={submitting}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending
                  </>
                ) : (
                  "Send announcement"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent announcements</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : list.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nothing posted yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {list.map((a) => (
                <Card key={a.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{a.title}</span>
                          <Badge variant="outline">{audienceLabel(a)}</Badge>
                          {a.priority !== "normal" && (
                            <Badge variant={a.priority === "urgent" ? "destructive" : "secondary"}>
                              {a.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                          {a.body}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatRelative(a.created_at)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(a.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncements;
