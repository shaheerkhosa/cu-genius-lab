import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Eye, ShieldCheck, AlertTriangle } from "lucide-react";

interface ProctoringGateProps {
  quizTitle: string;
  onAccept: () => void;
  onCancel: () => void;
}

export const ProctoringGate = ({ quizTitle, onAccept, onCancel }: ProctoringGateProps) => {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCamera = async () => {
    setRequesting(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach((t) => t.stop());
      onAccept();
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser to start the quiz."
          : "Failed to access camera. Make sure no other app is using it."
      );
      setRequesting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-12">
      <Card className="backdrop-blur border border-border/50 bg-card/80">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Integrity Check</h2>
              <p className="text-sm text-muted-foreground">Required before starting "{quizTitle}"</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <p className="text-foreground/80">
              This quiz uses your webcam to monitor for academic integrity violations. Your video is processed locally
              in your browser — only flagged events are recorded.
            </p>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p>
                  <span className="font-medium">Monitored signals:</span> face presence, multiple people, head
                  orientation, tab/window focus.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p>
                  <span className="font-medium">Auto-submit:</span> The quiz will be submitted automatically after 5
                  flagged events.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Camera className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p>
                  <span className="font-medium">Recommendations:</span> Stay facing the screen, keep your face
                  visible, and don't switch tabs during the quiz.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 pt-2">
            <Button variant="outline" onClick={onCancel} disabled={requesting} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={requestCamera} disabled={requesting} size="lg" className="rounded-xl px-6 gap-2">
              <Camera className="w-4 h-4" />
              {requesting ? "Requesting..." : "Enable Camera & Start"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
