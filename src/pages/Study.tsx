import { useEffect, useRef, useState } from 'react';
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SubjectCard } from '@/components/SubjectCard';
import { SubjectDetailModal } from '@/components/SubjectDetailModal';
import { StudyGuideDisplay } from '@/components/StudyGuideDisplay';
import { OllamaSettings, getOllamaUrl } from '@/components/OllamaSettings';
import { sampleStudent } from '@/data/sampleStudentData';
import { getCurrentSemesterPerformance, SubjectPerformance, getSubjectColor } from '@/lib/performanceAnalyzer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { ArrowRight, Sparkles } from 'lucide-react';

const Study = () => {
  const [currentSubjects] = useState(() => getCurrentSemesterPerformance(sampleStudent));
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectPerformance | null>(null);
  const [focusArea, setFocusArea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [studyGuide, setStudyGuide] = useState<string | null>(null);
  const [ollamaUrl, setOllamaUrl] = useState(getOllamaUrl());

  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    
    // Page entrance animations
    const tl = gsap.timeline();

    if (headerRef.current && cardsRef.current) {
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      )
      .fromTo(
        cardsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      );

      // Stagger card animations
      cardRefs.current.forEach((card, i) => {
        if (card) {
          gsap.fromTo(
            card,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              delay: 0.5 + i * 0.1,
              ease: 'power2.out',
            }
          );
        }
      });

      if (buttonRef.current) {
        gsap.fromTo(
          buttonRef.current,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            delay: 0.7 + currentSubjects.length * 0.1,
            ease: 'back.out(1.7)',
          }
        );
      }
      
      hasAnimated.current = true;
    }
  }, []);

  const handleGenerateGuide = async () => {
    if (selectedSubjects.length === 0) {
      toast({
        title: 'No Subjects Selected',
        description: 'Please select at least one subject to generate a study guide',
        variant: 'destructive',
      });
      return;
    }

    if (!ollamaUrl) {
      toast({
        title: 'Ollama Not Configured',
        description: 'Please set your Ollama ngrok URL in the settings above',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setStudyGuide(null);

    try {
      const selectedSubjectData = currentSubjects
        .filter(s => selectedSubjects.includes(s.code))
        .map(s => ({
          code: s.code,
          name: s.name,
          overallPerformance: s.overallPerformance,
          grade: s.grade,
          weakCLOs: s.weakCLOs,
          allCLOs: s.cloScores,
        }));

      const { data, error } = await supabase.functions.invoke('generate-study-guide', {
        body: {
          subjects: selectedSubjectData,
          focusArea: focusArea || undefined,
          ollamaUrl,
        },
      });

      if (error) throw error;

      setStudyGuide(data.studyGuide);

      // Scroll to study guide with animation
      setTimeout(() => {
        const guideElement = document.getElementById('study-guide');
        if (guideElement) {
          guideElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      toast({
        title: 'Study Guide Generated!',
        description: 'Your personalized study guide is ready',
      });
    } catch (error) {
      console.error('Error generating study guide:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate study guide',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleSubjectSelection = (code: string) => {
    setSelectedSubjects(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  return (
    <Layout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div ref={headerRef} className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
              <Sparkles className="w-4 h-4" />
              AI-Powered Learning
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Study Guide Generator
            </h1>
            <p className="text-muted-foreground text-lg">
              Generate personalized study guides for your current semester courses
            </p>
          </div>

          {/* Ollama Settings */}
          <div className="max-w-2xl mx-auto">
            <OllamaSettings onUrlChange={setOllamaUrl} />
          </div>

          {/* Subject Selection */}
          <div ref={cardsRef} className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Current Semester • {selectedSubjects.length} of {currentSubjects.length} selected
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {currentSubjects.map((subject, index) => (
                <div
                  key={subject.code}
                  ref={(el) => (cardRefs.current[index] = el)}
                >
                  <SubjectCard
                    subject={subject}
                    selected={selectedSubjects.includes(subject.code)}
                    onSelect={() => toggleSubjectSelection(subject.code)}
                    onMoreInfo={() => setSelectedSubject(subject)}
                    colorClass={getSubjectColor(subject.overallPerformance)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Focus Area (Optional) */}
          {selectedSubjects.length > 0 && (
            <div className="max-w-2xl mx-auto space-y-3">
              <Label htmlFor="focus-area" className="text-base">
                Special Focus (Optional)
              </Label>
              <Textarea
                id="focus-area"
                placeholder="e.g., 'I have an exam next week on algorithms' or 'Focus on practical applications'"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Generate Button */}
          <div ref={buttonRef} className="flex justify-center">
            <Button
              size="lg"
              onClick={handleGenerateGuide}
              disabled={selectedSubjects.length === 0 || generating}
              className="px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Generating Guide...
                </>
              ) : (
                <>
                  Generate Study Guide
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Study Guide Display */}
          {studyGuide && (
            <div id="study-guide" className="mt-12">
              <StudyGuideDisplay
                studyGuide={studyGuide}
                onRegenerate={handleGenerateGuide}
              />
            </div>
          )}
        </div>
      </div>

      {/* Subject Detail Modal */}
      <SubjectDetailModal
        subject={selectedSubject}
        open={!!selectedSubject}
        onClose={() => setSelectedSubject(null)}
      />
    </Layout>
  );
};

export default Study;
