import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GPAPrediction } from "@/lib/academicPredictor";

interface GPATrendChartProps {
  prediction: GPAPrediction;
}

const chartConfig = {
  gpa: {
    label: "Semester GPA",
    color: "hsl(var(--primary))",
  },
  cgpa: {
    label: "Cumulative GPA",
    color: "hsl(var(--accent))",
  },
};

export const GPATrendChart = ({ prediction }: GPATrendChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    if (statsRef.current) {
      tl.fromTo(
        statsRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }
      );
    }
    
    if (chartRef.current) {
      tl.fromTo(
        chartRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
        "-=0.3"
      );
    }
  }, []);

  const getTrendIcon = () => {
    switch (prediction.trend.trend) {
      case "improving":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "declining":
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (prediction.trend.trend) {
      case "improving":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "declining":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Stats Grid */}
      <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current CGPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{prediction.currentCGPA}</div>
            <p className="text-xs text-muted-foreground mt-1">out of 4.0</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Predicted Final</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-accent">{prediction.predictedFinalGPA}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Range: {prediction.range[0]} - {prediction.range[1]}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <Badge variant="outline" className={getTrendColor()}>
                {prediction.trend.trend.charAt(0).toUpperCase() + prediction.trend.trend.slice(1)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{prediction.trend.description}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card ref={chartRef} className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>GPA Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prediction.semesterData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis 
                  dataKey="semester" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  domain={[0, 4]} 
                  ticks={[0, 1, 2, 3, 4]}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ReferenceLine y={3.5} stroke="hsl(var(--accent))" strokeDasharray="5 5" opacity={0.5} />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="cgpa"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: "hsl(var(--accent))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Semester GPA</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-accent" style={{ width: 20 }} />
              <span className="text-sm text-muted-foreground">Cumulative GPA</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
