import { useState, useEffect, useRef } from 'react';
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, CheckCircle, AlertCircle, ClipboardList } from 'lucide-react';
import { ProctoringGate } from "@/components/ProctoringGate";
import { ProctoringOverlay } from "@/components/ProctoringOverlay";

interface AvailableQuiz {
  id: string;
  title: string;
  course_code: string;
  course_name: string;
  total_marks: number;
  schedule_start: string;
  schedule_end: string;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
  question_order: number;
}

const StudentQuiz = () => {
  const [quizzes, setQuizzes] = useState<AvailableQuiz[]>([]);
  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<AvailableQuiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [proctoringReady, setProctoringReady] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const submitInFlightRef = useRef(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get courses the student is enrolled in
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_code')
      .eq('student_id', user.id);

    const enrolledCodes = enrollments?.map(e => e.course_code) || [];

    if (enrolledCodes.length === 0) {
      setQuizzes([]);
      setLoading(false);
      return;
    }

    // Fetch online quizzes that are currently live for enrolled courses
    const { data, error } = await supabase
      .from('assessments')
      .select('id, title, course_code, course_name, total_marks, schedule_start, schedule_end')
      .eq('is_online_quiz', true)
      .in('course_code', enrolledCodes)
      .lte('schedule_start', new Date().toISOString())
      .gte('schedule_end', new Date().toISOString());

    if (!error && data) {
      setQuizzes(data as AvailableQuiz[]);
    }

    // Fetch completed attempts
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('assessment_id')
      .eq('student_id', user.id)
      .not('completed_at', 'is', null);

    if (attempts) {
      setCompletedQuizIds(attempts.map(a => a.assessment_id));
    }
    setLoading(false);
  };

  const startQuiz = async (quiz: AvailableQuiz) => {
    const { data: qs, error } = await supabase
      .from('quiz_questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, marks, question_order')
      .eq('assessment_id', quiz.id)
      .order('question_order');

    if (error || !qs || qs.length === 0) {
      toast.error('Quiz has no questions yet');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return; }

    const { error: attemptError } = await supabase.from('quiz_attempts').insert({
      assessment_id: quiz.id,
      student_id: user.id,
      total_marks: quiz.total_marks,
    });

    if (attemptError && attemptError.code !== '23505') {
      toast.error('Failed to start quiz');
      return;
    }

    setStudentId(user.id);
    setActiveQuiz(quiz);
    setQuestions(qs as QuizQuestion[]);
    setAnswers({});
    setResult(null);
    setProctoringReady(false);
  };

  const handleSubmit = async (opts: { auto?: boolean } = {}) => {
    if (!activeQuiz) return;
    if (submitInFlightRef.current) return;

    if (!opts.auto) {
      const unanswered = questions.filter(q => !answers[q.id]);
      if (unanswered.length > 0) {
        toast.error(`Please answer all questions (${unanswered.length} unanswered)`);
        return;
      }
    }

    submitInFlightRef.current = true;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); submitInFlightRef.current = false; return; }

    const { data: fullQs } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('assessment_id', activeQuiz.id);

    if (!fullQs) { toast.error('Failed to grade'); setSubmitting(false); submitInFlightRef.current = false; return; }

    let score = 0;
    const responses = questions
      .filter(q => opts.auto ? answers[q.id] : true)
      .map(q => {
        const fullQ = fullQs.find(fq => fq.id === q.id);
        const isCorrect = fullQ && answers[q.id] === fullQ.correct_option;
        if (isCorrect) score += q.marks;
        return {
          assessment_id: activeQuiz.id,
          student_id: user.id,
          question_id: q.id,
          selected_option: answers[q.id],
          is_correct: isCorrect || false,
        };
      });

    if (responses.length > 0) {
      const { error: respError } = await supabase.from('quiz_responses').insert(responses);
      if (respError && !opts.auto) {
        toast.error('Failed to submit responses');
        setSubmitting(false);
        submitInFlightRef.current = false;
        return;
      }
    }

    await supabase.from('quiz_attempts').update({
      completed_at: new Date().toISOString(),
      score,
    }).eq('assessment_id', activeQuiz.id).eq('student_id', user.id);

    setResult({ score, total: activeQuiz.total_marks });
    setCompletedQuizIds(prev => [...prev, activeQuiz.id]);
    if (!opts.auto) toast.success('Quiz submitted!');
    setSubmitting(false);
    submitInFlightRef.current = false;
  };

  const timeRemaining = (endStr: string) => {
    const diff = new Date(endStr).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m remaining`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m remaining`;
  };

  // Proctoring permission gate (shown before quiz questions)
  if (activeQuiz && !result && !proctoringReady) {
    return (
      <Layout>
        <div className="relative min-h-screen p-8">
          <DecorativeBackground />
          <div className="relative z-10">
            <ProctoringGate
              quizTitle={activeQuiz.title}
              onAccept={() => setProctoringReady(true)}
              onCancel={() => { setActiveQuiz(null); setQuestions([]); setProctoringReady(false); }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Quiz taking view
  if (activeQuiz && !result) {
    return (
      <Layout>
        <div className="relative min-h-screen p-8">
          <DecorativeBackground />
          {studentId && (
            <ProctoringOverlay
              assessmentId={activeQuiz.id}
              studentId={studentId}
              onAutoSubmit={() => handleSubmit({ auto: true })}
            />
          )}
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{activeQuiz.title}</h1>
                <p className="text-sm text-muted-foreground">{activeQuiz.course_code} — {activeQuiz.course_name}</p>
              </div>
              <Badge variant="secondary" className="text-sm gap-1">
                <Clock className="w-4 h-4" /> {timeRemaining(activeQuiz.schedule_end)}
              </Badge>
            </div>

            {questions.map((q, i) => (
              <Card key={q.id} className="backdrop-blur border border-border/50 bg-card/80">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <p className="font-medium">
                      <span className="text-primary mr-2">Q{i + 1}.</span>
                      {q.question_text}
                    </p>
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">{q.marks} mark{q.marks > 1 ? 's' : ''}</Badge>
                  </div>

                  <RadioGroup value={answers[q.id] || ''} onValueChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}>
                    {(['a', 'b', 'c', 'd'] as const).map(opt => (
                      <div key={opt} className="flex items-center space-x-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                        <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                        <Label htmlFor={`${q.id}-${opt}`} className="flex-1 cursor-pointer text-sm">
                          <span className="font-semibold uppercase mr-2">{opt}.</span>
                          {q[`option_${opt}`]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={() => { setActiveQuiz(null); setQuestions([]); setProctoringReady(false); }} className="rounded-xl">
                Cancel
              </Button>
              <Button size="lg" onClick={() => handleSubmit()} disabled={submitting} className="rounded-xl px-8">
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Result view
  if (activeQuiz && result) {
    const percentage = Math.round((result.score / result.total) * 100);
    return (
      <Layout>
        <div className="relative min-h-screen p-8">
          <DecorativeBackground />
          <div className="relative z-10 max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <Card className="w-full backdrop-blur border border-border/50 bg-card/80 text-center">
              <CardContent className="p-8 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold">Quiz Completed!</h2>
                <p className="text-muted-foreground">{activeQuiz.title}</p>
                <div className="text-5xl font-bold text-primary">{result.score}/{result.total}</div>
                <p className="text-lg text-muted-foreground">{percentage}%</p>
                <Button onClick={() => { setActiveQuiz(null); setResult(null); setProctoringReady(false); fetchQuizzes(); }} className="w-full rounded-xl mt-4">
                  Back to Quizzes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // Quiz list view
  return (
    <Layout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <ClipboardList className="w-4 h-4" />
              Online Quizzes
            </div>
            <h1 className="text-4xl font-bold text-foreground">Available Quizzes</h1>
            <p className="text-muted-foreground">Complete your scheduled quizzes before they expire</p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : quizzes.length === 0 ? (
            <Card className="backdrop-blur border border-border/50 bg-card/80">
              <CardContent className="py-12 text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No quizzes available right now.</p>
                <p className="text-sm mt-1">Check back when your instructor schedules one.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {quizzes.map(quiz => {
                const completed = completedQuizIds.includes(quiz.id);
                return (
                  <Card key={quiz.id} className={`backdrop-blur border transition-all ${completed ? 'border-green-500/30 bg-green-500/5' : 'border-border/50 bg-card/80 hover:shadow-lg'}`}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{quiz.title}</h3>
                        <p className="text-sm text-muted-foreground">{quiz.course_code} — {quiz.course_name}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{quiz.total_marks} marks</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeRemaining(quiz.schedule_end)}</span>
                        </div>
                      </div>
                      {completed ? (
                        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-0 gap-1">
                          <CheckCircle className="w-4 h-4" /> Completed
                        </Badge>
                      ) : (
                        <Button onClick={() => startQuiz(quiz)} className="rounded-xl">
                          Start Quiz
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentQuiz;
