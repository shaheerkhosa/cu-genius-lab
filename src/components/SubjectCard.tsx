import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SubjectPerformance } from '@/lib/performanceAnalyzer';

interface SubjectCardProps {
  subject: SubjectPerformance;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onMoreInfo: () => void;
  colorClass: string;
}

export function SubjectCard({ subject, selected, onSelect, onMoreInfo, colorClass }: SubjectCardProps) {
  const performance = Math.round(subject.overallPerformance);

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${
        selected ? 'ring-2 ring-primary shadow-lg scale-105' : ''
      }`}
      onClick={() => onSelect(!selected)}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-90`} />
      
      {/* Content */}
      <CardContent className="relative z-10 p-6 text-white space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight mb-1">
              {subject.name}
            </h3>
            <p className="text-sm opacity-90">{subject.code} - {subject.grade}</p>
          </div>
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="bg-white/20 border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Performance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">Performance</span>
            <span className="text-2xl font-bold">{performance}%</span>
          </div>
          <Progress value={performance} className="h-2 bg-white/30" />
        </div>

        {/* Weak CLOs indicator */}
        {subject.weakCLOs.length > 0 && (
          <div className="text-xs bg-white/20 backdrop-blur rounded-lg px-3 py-2">
            ⚠️ {subject.weakCLOs.length} CLO{subject.weakCLOs.length > 1 ? 's' : ''} need attention
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMoreInfo();
            }}
            className="text-white hover:bg-white/20 text-xs"
          >
            More Info
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onMoreInfo();
            }}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
