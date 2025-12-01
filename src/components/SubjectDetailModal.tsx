import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SubjectPerformance } from '@/lib/performanceAnalyzer';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SubjectDetailModalProps {
  subject: SubjectPerformance | null;
  open: boolean;
  onClose: () => void;
}

export function SubjectDetailModal({ subject, open, onClose }: SubjectDetailModalProps) {
  if (!subject) return null;

  const getCLOIcon = (score: number) => {
    if (score >= 75) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getCLOBadge = (score: number) => {
    if (score >= 75) return <Badge variant="default">Strong</Badge>;
    if (score >= 60) return <Badge variant="secondary">Moderate</Badge>;
    return <Badge variant="destructive">Weak</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{subject.name}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{subject.code}</span>
            <span>•</span>
            <span>{subject.semester}</span>
            <span>•</span>
            <span>Grade: {subject.grade}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Overall Performance */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Overall Performance</span>
              <span className="text-3xl font-bold text-primary">
                {Math.round(subject.overallPerformance)}%
              </span>
            </div>
            <Progress value={subject.overallPerformance} className="h-3" />
          </div>

          {/* CLO Breakdown */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Course Learning Outcomes (CLOs)</h3>
            <div className="space-y-3">
              {subject.cloScores.map((clo) => (
                <div
                  key={clo.cloNumber}
                  className={`p-4 rounded-lg border-2 ${
                    clo.score < 60
                      ? 'border-red-500/30 bg-red-500/5'
                      : clo.score < 75
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-green-500/30 bg-green-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    {getCLOIcon(clo.score)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">CLO {clo.cloNumber}</span>
                        <div className="flex items-center gap-2">
                          {getCLOBadge(clo.score)}
                          <span className="font-semibold">{Math.round(clo.score)}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{clo.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {clo.assessmentType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Progress value={clo.score} className="h-2 mt-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {subject.weakCLOs.length > 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                Areas Needing Improvement
              </h4>
              <ul className="space-y-2 text-sm">
                {subject.weakCLOs.map((clo) => (
                  <li key={clo.cloNumber} className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">•</span>
                    <span>
                      <strong>CLO {clo.cloNumber}:</strong> {clo.description} ({Math.round(clo.score)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Study Tips */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="font-semibold text-primary mb-2">💡 Quick Tips</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Review lecture notes for weak CLO areas</li>
              <li>• Practice past assignments related to these concepts</li>
              <li>• Seek help from instructor or tutoring center</li>
              <li>• Form study groups with classmates</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
