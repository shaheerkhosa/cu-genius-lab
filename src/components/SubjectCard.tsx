import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SubjectPerformance, getPerformanceBorderColor } from '@/lib/performanceAnalyzer';
import { Badge } from '@/components/ui/badge';

interface SubjectCardProps {
  subject: SubjectPerformance;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onMoreInfo: () => void;
  colorClass: string;
}

export function SubjectCard({ subject, selected, onSelect, onMoreInfo }: SubjectCardProps) {
  const performance = Math.round(subject.overallPerformance);
  const borderColor = getPerformanceBorderColor(subject.overallPerformance);

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer bg-card/50 backdrop-blur border-l-4 ${borderColor} ${
        selected ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : 'border-border/50'
      }`}
      onClick={() => onSelect(!selected)}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight mb-1 truncate">
              {subject.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{subject.code}</span>
              <span>•</span>
              <Badge variant="outline" className="text-xs font-semibold">
                {subject.grade}
              </Badge>
            </div>
          </div>
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Performance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Performance</span>
            <span className="text-lg font-bold">{performance}%</span>
          </div>
          <Progress value={performance} className="h-1.5" />
        </div>

        {/* Weak CLOs indicator */}
        {subject.weakCLOs.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs bg-warning/10 text-warning rounded-md px-2.5 py-1.5">
            <span className="text-base">⚠️</span>
            <span className="font-medium">
              {subject.weakCLOs.length} CLO{subject.weakCLOs.length > 1 ? 's' : ''} need attention
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMoreInfo();
            }}
            className="text-xs h-8 hover:bg-accent/50"
          >
            <Info className="w-3.5 h-3.5 mr-1.5" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
