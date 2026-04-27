import { useEffect, useRef, useState, useCallback } from "react";
import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { supabase } from "@/integrations/supabase/client";
import { Eye, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type EventType = "no_face" | "multiple_faces" | "head_turned" | "tab_blur" | "permission_denied" | "auto_submit";

interface ProctoringOverlayProps {
  assessmentId: string;
  studentId: string;
  maxViolations?: number;
  onAutoSubmit: () => void;
}

const NO_FACE_THRESHOLD_MS = 3000;
const HEAD_TURN_THRESHOLD_MS = 2000;
const HEAD_YAW_LIMIT_DEG = 25;
const COOLDOWN_MS = 4000;

export const ProctoringOverlay = ({
  assessmentId,
  studentId,
  maxViolations = 5,
  onAutoSubmit,
}: ProctoringOverlayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const noFaceSinceRef = useRef<number | null>(null);
  const headTurnedSinceRef = useRef<number | null>(null);
  const lastEventAtRef = useRef<Record<EventType, number>>({
    no_face: 0,
    multiple_faces: 0,
    head_turned: 0,
    tab_blur: 0,
    permission_denied: 0,
    auto_submit: 0,
  });
  const submittedRef = useRef(false);

  const [violations, setViolations] = useState(0);
  const [status, setStatus] = useState<"loading" | "ok" | "warning">("loading");
  const [lastWarning, setLastWarning] = useState<string | null>(null);

  const recordEvent = useCallback(
    async (eventType: EventType, severity: "info" | "warning" | "critical", metadata: Record<string, unknown> = {}) => {
      const now = Date.now();
      if (now - lastEventAtRef.current[eventType] < COOLDOWN_MS && eventType !== "auto_submit") {
        return;
      }
      lastEventAtRef.current[eventType] = now;

      await supabase.from("quiz_proctoring_events").insert({
        assessment_id: assessmentId,
        student_id: studentId,
        event_type: eventType,
        severity,
        metadata,
      });

      if (eventType !== "auto_submit") {
        setViolations((v) => {
          const next = v + 1;
          if (next >= maxViolations && !submittedRef.current) {
            submittedRef.current = true;
            void supabase.from("quiz_proctoring_events").insert({
              assessment_id: assessmentId,
              student_id: studentId,
              event_type: "auto_submit",
              severity: "critical",
              metadata: { violation_count: next },
            });
            toast.error("Quiz auto-submitted: too many integrity violations");
            onAutoSubmit();
          }
          return next;
        });
      }
    },
    [assessmentId, studentId, maxViolations, onAutoSubmit]
  );

  const flagWarning = useCallback((message: string) => {
    setStatus("warning");
    setLastWarning(message);
    setTimeout(() => setStatus((s) => (s === "warning" ? "ok" : s)), 2500);
  }, []);

  // Tab/window blur detection
  useEffect(() => {
    const onBlur = () => {
      if (submittedRef.current) return;
      void recordEvent("tab_blur", "warning", { at: new Date().toISOString() });
      flagWarning("Tab/window left focus");
    };
    const onVisChange = () => {
      if (document.visibilityState === "hidden") onBlur();
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisChange);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, [recordEvent, flagWarning]);

  // Setup camera + landmarker
  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 2,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setStatus("ok");

        const tick = () => {
          if (cancelled || !videoRef.current || !landmarkerRef.current) return;
          const video = videoRef.current;
          if (video.readyState >= 2) {
            const result: FaceLandmarkerResult = landmarkerRef.current.detectForVideo(video, performance.now());
            handleResult(result);
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        console.error("Proctoring setup failed:", err);
        void recordEvent("permission_denied", "critical", { message: String(err) });
        toast.error("Camera access required for this quiz");
      }
    };

    const handleResult = (result: FaceLandmarkerResult) => {
      const now = performance.now();
      const numFaces = result.faceLandmarks?.length ?? 0;

      if (numFaces === 0) {
        if (noFaceSinceRef.current === null) noFaceSinceRef.current = now;
        else if (now - noFaceSinceRef.current > NO_FACE_THRESHOLD_MS) {
          void recordEvent("no_face", "warning", { duration_ms: Math.round(now - noFaceSinceRef.current) });
          flagWarning("No face detected");
          noFaceSinceRef.current = now;
        }
        headTurnedSinceRef.current = null;
        return;
      } else {
        noFaceSinceRef.current = null;
      }

      if (numFaces > 1) {
        void recordEvent("multiple_faces", "critical", { count: numFaces });
        flagWarning(`${numFaces} faces detected`);
        return;
      }

      const matrix = result.facialTransformationMatrixes?.[0]?.data;
      if (matrix && matrix.length === 16) {
        // Column-major 4x4. Yaw = atan2(-m20, m00) in radians.
        const m00 = matrix[0];
        const m20 = matrix[2];
        const yawDeg = (Math.atan2(-m20, m00) * 180) / Math.PI;

        if (Math.abs(yawDeg) > HEAD_YAW_LIMIT_DEG) {
          if (headTurnedSinceRef.current === null) headTurnedSinceRef.current = now;
          else if (now - headTurnedSinceRef.current > HEAD_TURN_THRESHOLD_MS) {
            void recordEvent("head_turned", "warning", { yaw_deg: Math.round(yawDeg) });
            flagWarning(`Looking away (${Math.round(yawDeg)}°)`);
            headTurnedSinceRef.current = now;
          }
        } else {
          headTurnedSinceRef.current = null;
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [recordEvent, flagWarning]);

  const remaining = Math.max(0, maxViolations - violations);
  const ringColor =
    status === "loading"
      ? "ring-muted-foreground/30"
      : status === "warning"
      ? "ring-red-500/80"
      : "ring-emerald-500/60";

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 select-none">
      <div className={`relative w-40 h-32 rounded-2xl overflow-hidden ring-2 ${ringColor} shadow-2xl bg-black transition-all`}>
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-[10px] text-white">
          {status === "warning" ? (
            <>
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>Alert</span>
            </>
          ) : status === "loading" ? (
            <>
              <Eye className="w-3 h-3 animate-pulse" />
              <span>Loading…</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Monitored</span>
            </>
          )}
        </div>
      </div>

      <Badge
        variant={violations === 0 ? "secondary" : remaining <= 2 ? "destructive" : "outline"}
        className="text-xs gap-1 backdrop-blur bg-background/80"
      >
        {violations === 0 ? (
          <>Integrity OK</>
        ) : (
          <>
            {violations}/{maxViolations} flags
          </>
        )}
      </Badge>

      {lastWarning && status === "warning" && (
        <div className="bg-red-500/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg max-w-[180px] text-right">
          {lastWarning}
        </div>
      )}
    </div>
  );
};
