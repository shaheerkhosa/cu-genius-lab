import { useEffect, useRef, useState } from 'react';
import { TeacherLayout } from "@/components/TeacherLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StudyGuideDisplay } from '@/components/StudyGuideDisplay';
import { OllamaSettings, getOllamaUrl } from '@/components/OllamaSettings';
import { sampleStudent } from '@/data/sampleStudentData';
import { getCurrentSemesterPerformance, SubjectPerformance, CLOScore, getSubjectColor } from '@/lib/performanceAnalyzer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { ArrowRight, Sparkles, ChevronLeft, BookOpen, Zap } from 'lucide-react';

const TeacherStudyGuide = () => {
  const [currentSubjects] = useState(() => getCurrentSemesterPerformance(sampleStudent));
  const [selectedSubject, setSelectedSubject] = useState<SubjectPerformance | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingTopic, setGeneratingTopic] = useState<number | null>(null);
  const [studyGuide, setStudyGuide] = useState<string | null>(null);
  const [ollamaUrl, setOllamaUrl] = useState(getOllamaUrl());

  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    const tl = gsap.timeline();
    if (headerRef.current && contentRef.current) {
      tl.fromTo(headerRef.current, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
        .fromTo(contentRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
      hasAnimated.current = true;
    }
  }, []);

  // Animate when switching between subjects/topics view
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, { opacity: 0, x: selectedSubject ? 30 : -30 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' });
    }
  }, [selectedSubject]);

  const checkOllama = () => {
    if (!ollamaUrl) {
      toast({ title: 'Ollama Not Configured', description: 'Please set your Ollama ngrok URL in the settings above', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const generateForSubject = async (subject: SubjectPerformance) => {
    if (!checkOllama()) return;
    setGenerating(true);
    setStudyGuide(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-guide', {
        body: {
          subjects: [{
            code: subject.code, name: subject.name, overallPerformance: subject.overallPerformance,
            grade: subject.grade, weakCLOs: subject.weakCLOs, allCLOs: subject.cloScores,
          }],
          ollamaUrl,
        },
      });
      if (error) throw error;
      setStudyGuide(data.studyGuide);
      setTimeout(() => document.getElementById('study-guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      toast({ title: 'Study Guide Generated!', description: `Full guide for ${subject.name} is ready` });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Generation Failed', description: error instanceof Error ? error.message : 'Failed to generate', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const generateForTopic = async (subject: SubjectPerformance, clo: CLOScore) => {
    if (!checkOllama()) return;
    setGeneratingTopic(clo.cloNumber);
    setStudyGuide(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-guide', {
        body: {
          subjects: [{
            code: subject.code, name: subject.name, overallPerformance: subject.overallPerformance,
            grade: subject.grade,
            weakCLOs: [clo],
            allCLOs: [clo],
          }],
          focusArea: `Focus specifically on CLO ${clo.cloNumber}: "${clo.description}". Provide an in-depth guide for this specific topic only.`,
          ollamaUrl,
        },
      });
      if (error) throw error;
      setStudyGuide(data.studyGuide);
      setTimeout(() => document.getElementById('study-guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      toast({ title: 'Topic Guide Generated!', description: `Guide for CLO ${clo.cloNumber} is ready` });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Generation Failed', description: error instanceof Error ? error.message : 'Failed to generate', variant: 'destructive' });
    } finally {
      setGeneratingTopic(null);
    }
  };

  const getBackgroundColor = (performance: number) => {
    if (performance >= 85) return 'bg-green-400/20 hover:bg-green-400/30';
    if (performance >= 70) return 'bg-blue-400/20 hover:bg-blue-400/30';
    if (performance >= 60) return 'bg-yellow-400/20 hover:bg-yellow-400/30';
    return 'bg-red-400/20 hover:bg-red-400/30';
  };

  const getCLOStatusColor = (score: number) => {
    if (score >= 75) return 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20';
    if (score >= 60) return 'border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20';
    return 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20';
  };

  const isGenerating = generating || generatingTopic !== null;

  return (
    <TeacherLayout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div ref={headerRef} className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
              <Sparkles className="w-4 h-4" />
              AI-Powered Learning
            </div>
            <h1 className="text-5xl font-bold">
              <span className="text-primary">Study Guide</span>
              <br />
              <span className="text-foreground">Generator</span>
            </h1>
          </div>

          {/* Ollama Settings */}
          <div className="max-w-2xl mx-auto">
            <OllamaSettings onUrlChange={setOllamaUrl} />
          </div>

          {/* Content */}
          <div ref={contentRef}>
            {!selectedSubject ? (
              /* Subject Cards Grid */
              <div className="space-y-6">
                <div className="text-center">
                  <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                    Select a Subject
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
                  {currentSubjects.map((subject) => (
                    <Card
                      key={subject.code}
                      className={`relative overflow-hidden transition-all duration-300 cursor-pointer backdrop-blur border border-border/50 hover:shadow-lg hover:scale-[1.02] ${getBackgroundColor(subject.overallPerformance)}`}
                      onClick={() => { setSelectedSubject(subject); setStudyGuide(null); }}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg leading-tight">{subject.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{subject.code}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs font-semibold">{subject.grade}</Badge>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Performance</span>
                            <span className="text-lg font-bold">{Math.round(subject.overallPerformance)}%</span>
                          </div>
                          <Progress value={subject.overallPerformance} className="h-1.5" />
                        </div>
                        {subject.weakCLOs.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs bg-destructive/10 text-destructive rounded-md px-2.5 py-1.5">
                            <span>⚠️</span>
                            <span className="font-medium">{subject.weakCLOs.length} topic{subject.weakCLOs.length > 1 ? 's' : ''} need attention</span>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {subject.cloScores.length} topics • Click to view
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              /* Topics View for Selected Subject */
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Back + Subject header */}
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedSubject(null); setStudyGuide(null); }} className="gap-1">
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{selectedSubject.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedSubject.code} • {selectedSubject.grade} • {Math.round(selectedSubject.overallPerformance)}%</p>
                  </div>
                </div>

                {/* Generate Full Guide Button */}
                <Button
                  size="lg"
                  onClick={() => generateForSubject(selectedSubject)}
                  disabled={isGenerating}
                  className="w-full py-6 text-base font-semibold rounded-xl shadow-lg"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Generating Full Guide...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Generate Full Study Guide
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                {/* Topics (CLOs) */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Topics (CLOs)</h3>
                  <p className="text-sm text-muted-foreground">Click a topic to generate a focused study guide for it</p>

                  {selectedSubject.cloScores.map((clo) => (
                    <Card
                      key={clo.cloNumber}
                      className={`border-2 transition-all duration-200 cursor-pointer ${getCLOStatusColor(clo.score)} ${generatingTopic === clo.cloNumber ? 'animate-pulse' : ''}`}
                      onClick={() => !isGenerating && generateForTopic(selectedSubject, clo)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">CLO {clo.cloNumber}</span>
                            <Badge variant={clo.score >= 75 ? 'default' : clo.score >= 60 ? 'secondary' : 'destructive'} className="text-xs">
                              {clo.score >= 75 ? 'Strong' : clo.score >= 60 ? 'Moderate' : 'Weak'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{clo.assessmentType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{clo.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-bold">{Math.round(clo.score)}%</span>
                        </div>
                        {generatingTopic === clo.cloNumber ? (
                          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Study Guide Display */}
          {studyGuide && (
            <div id="study-guide" className="mt-12">
              <StudyGuideDisplay
                studyGuide={studyGuide}
                onRegenerate={() => {
                  if (selectedSubject) generateForSubject(selectedSubject);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherStudyGuide;
