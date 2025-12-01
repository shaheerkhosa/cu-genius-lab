import { useState, useRef, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { PillToggle } from "@/components/PillToggle";
import { GPATrendChart } from "@/components/GPATrendChart";
import { GraduationTimeline } from "@/components/GraduationTimeline";
import { sampleStudent } from "@/data/sampleStudentData";
import { predictFinalGPA, estimateGraduation } from "@/lib/academicPredictor";
import { User, BookOpen } from "lucide-react";

const Estimator = () => {
  const [activeView, setActiveView] = useState<string>("gpa");
  
  // GSAP refs
  const headerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Calculate predictions
  const gpaPrediction = useMemo(() => predictFinalGPA(sampleStudent), []);
  const graduationPrediction = useMemo(() => estimateGraduation(sampleStudent), []);

  // Entrance animation
  useEffect(() => {
    const tl = gsap.timeline();
    
    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
    
    if (toggleRef.current) {
      tl.fromTo(
        toggleRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" },
        "-=0.3"
      );
    }
    
    if (contentRef.current) {
      tl.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "-=0.2"
      );
    }
  }, []);

  // View switch animation
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: activeView === "gpa" ? -20 : 20 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [activeView]);

  return (
    <Layout>
      <div className="relative min-h-screen p-4 md:p-8">
        <DecorativeBackground />
        
        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div ref={headerRef} className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Academic Estimator
            </h1>
            
            {/* Student Info */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{sampleStudent.name}</span>
              </div>
              <span className="hidden md:inline">•</span>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{sampleStudent.program}</span>
              </div>
              <span className="hidden md:inline">•</span>
              <span>Semester {sampleStudent.currentSemester}</span>
            </div>
          </div>

          {/* Centered Pill Toggle */}
          <div ref={toggleRef} className="flex justify-center">
            <PillToggle
              value={activeView}
              onChange={setActiveView}
              options={[
                { value: "gpa", label: "GPA" },
                { value: "graduation", label: "Graduation" },
              ]}
            />
          </div>

          {/* Content Area */}
          <div ref={contentRef}>
            {activeView === "gpa" ? (
              <GPATrendChart prediction={gpaPrediction} />
            ) : (
              <GraduationTimeline 
                prediction={graduationPrediction}
                totalCreditsRequired={sampleStudent.totalCreditsRequired}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Estimator;
