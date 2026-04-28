import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, EyeOff, Users as UsersIcon, ArrowLeftRight, Camera, ShieldAlert } from "lucide-react";

interface ProctoringEvent {
  id: string;
  event_type: string;
  severity: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ProctoringEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  studentId: string;
  studentName: string;
}

const eventConfig: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
  no_face: {
    label: "No face detected",
    icon: <EyeOff className="w-4 h-4" />,
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  multiple_faces: {
    label: "Multiple faces in frame",
    icon: <UsersIcon className="w-4 h-4" />,
    tone: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  },
  head_turned: {
    label: "Looking away",
    icon: <ArrowLeftRight className="w-4 h-4" />,
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  tab_blur: {
    label: "Switched tab / window",
    icon: <ArrowLeftRight className="w-4 h-4" />,
    tone: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  },
  permission_denied: {
    label: "Camera blocked",
    icon: <Camera className="w-4 h-4" />,
    tone: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  },
  auto_submit: {
    label: "Auto-submitted (limit hit)",
    icon: <ShieldAlert className="w-4 h-4" />,
    tone: "bg-red-600/20 text-red-700 dark:text-red-300 border-red-600/40",
  },
};

const severityTone: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  critical: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export const ProctoringEventsDialog = ({
  open,
  onOpenChange,
  assessmentId,
  studentId,
  studentName,
}: ProctoringEventsDialogProps) => {
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchEvents = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("quiz_proctoring_events")
        .select("id, event_type, severity, metadata, created_at")
        .eq("assessment_id", assessmentId)
        .eq("student_id", studentId)
        .order("created_at", { ascending: true });
      setEvents((data as ProctoringEvent[]) || []);
      setLoading(false);
    };
    void fetchEvents();
  }, [open, assessmentId, studentId]);

  const formatMeta = (meta: Record<string, unknown> | null) => {
    if (!meta) return null;
    const entries = Object.entries(meta);
    if (entries.length === 0) return null;
    return entries
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(" • ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Proctoring events — {studentName}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading…</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No proctoring events recorded.
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh] pr-3">
              <ol className="space-y-2">
                {events.map((e, i) => {
                  const cfg = eventConfig[e.event_type] || {
                    label: e.event_type,
                    icon: <AlertTriangle className="w-4 h-4" />,
                    tone: "bg-muted text-muted-foreground border-border",
                  };
                  const meta = formatMeta(e.metadata);
                  const ts = new Date(e.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  return (
                    <li
                      key={e.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.tone}`}
                    >
                      <div className="mt-0.5 shrink-0">{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {i + 1}. {cfg.label}
                          </span>
                          <Badge className={`text-[10px] uppercase ${severityTone[e.severity] || severityTone.info}`}>
                            {e.severity}
                          </Badge>
                        </div>
                        <div className="text-xs opacity-80 mt-0.5">{ts}</div>
                        {meta && <div className="text-xs opacity-70 mt-1 font-mono">{meta}</div>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
