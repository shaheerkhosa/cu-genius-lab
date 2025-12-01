import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  Check, 
  AlertTriangle, 
  Trophy, 
  Clock, 
  Flag,
  AlertCircle
} from "lucide-react";
import { GraduationPrediction, Milestone } from "@/lib/academicPredictor";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GraduationTimelineProps {
  prediction: GraduationPrediction;
  totalCreditsRequired: number;
}

const getIcon = (icon: Milestone["icon"]) => {
  switch (icon) {
    case "check":
      return <Check className="h-4 w-4" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4" />;
    case "trophy":
      return <Trophy className="h-4 w-4" />;
    case "clock":
      return <Clock className="h-4 w-4" />;
    case "flag":
      return <Flag className="h-4 w-4" />;
    case "graduation":
      return <GraduationCap className="h-4 w-4" />;
    default:
      return <Check className="h-4 w-4" />;
  }
};

const getStatusStyles = (status: Milestone["status"]) => {
  switch (status) {
    case "completed":
      return "bg-green-500 text-white border-green-500";
    case "current":
      return "bg-primary text-primary-foreground border-primary animate-pulse";
    case "future":
      return "bg-muted text-muted-foreground border-border";
    case "start":
      return "bg-accent text-accent-foreground border-accent";
    case "graduation":
      return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-yellow-500";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getLineStyle = (status: Milestone["status"]) => {
  switch (status) {
    case "completed":
    case "start":
      return "bg-green-500";
    case "current":
      return "bg-gradient-to-b from-green-500 to-muted";
    default:
      return "bg-border";
  }
};

export const GraduationTimeline = ({ prediction, totalCreditsRequired }: GraduationTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const milestonesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const tl = gsap.timeline();
    
    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
    
    milestonesRef.current.forEach((el, index) => {
      if (el) {
        tl.fromTo(
          el,
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" },
          `-=${index === 0 ? 0 : 0.3}`
        );
      }
    });
  }, []);

  const progressPercent = (prediction.creditsEarned / totalCreditsRequired) * 100;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header Card */}
      <Card ref={headerRef} className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-primary/20">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Graduation</p>
                <p className="text-3xl font-bold text-foreground">{prediction.expectedDate}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">{prediction.confidence}%</p>
                <p className="text-sm text-muted-foreground">Confidence</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{prediction.semestersRemaining}</p>
                <p className="text-sm text-muted-foreground">Semesters Left</p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Credits Progress</span>
              <span className="font-medium">{prediction.creditsEarned} / {totalCreditsRequired}</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {prediction.riskFactors.length > 0 && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {prediction.riskFactors.map((risk, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  {risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Academic Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div ref={timelineRef} className="relative">
              {prediction.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  ref={el => milestonesRef.current[index] = el}
                  className="flex gap-4 pb-8 last:pb-0"
                >
                  {/* Timeline line + node */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-2
                        ${getStatusStyles(milestone.status)}
                      `}
                    >
                      {getIcon(milestone.icon)}
                    </div>
                    {index < prediction.milestones.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-2 ${getLineStyle(milestone.status)}`} />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{milestone.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {milestone.date}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    
                    {/* Stats */}
                    {(milestone.gpa || milestone.credits) && (
                      <div className="flex gap-4 mt-2">
                        {milestone.gpa && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            GPA: {milestone.gpa}
                          </span>
                        )}
                        {milestone.credits && (
                          <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                            {milestone.credits} credits
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Highlights */}
                    {milestone.highlights && milestone.highlights.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {milestone.highlights.map((highlight, hIndex) => (
                          <Badge 
                            key={hIndex}
                            variant={highlight.toLowerCase().includes("fail") || highlight.toLowerCase().includes("warning") ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
