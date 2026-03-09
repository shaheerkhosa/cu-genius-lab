import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';

interface QuizQuestion {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  marks: number;
  question_order: number;
}

interface QuizBuilderProps {
  assessmentId: string;
  totalMarks: number;
  existingQuestions?: QuizQuestion[];
  onSaved?: () => void;
}

export const QuizBuilder = ({ assessmentId, totalMarks, existingQuestions = [], onSaved }: QuizBuilderProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    existingQuestions.length > 0
      ? existingQuestions
      : [createEmptyQuestion(0)]
  );
  const [saving, setSaving] = useState(false);

  function createEmptyQuestion(order: number): QuizQuestion {
    return {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'a',
      marks: 1,
      question_order: order,
    };
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, createEmptyQuestion(prev.length)]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, question_order: i })));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const currentTotalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const handleSave = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        toast.error(`All options for question ${i + 1} are required`);
        return;
      }
    }

    if (currentTotalMarks !== totalMarks) {
      toast.error(`Total question marks (${currentTotalMarks}) must equal assessment total (${totalMarks})`);
      return;
    }

    setSaving(true);

    // Delete existing questions and re-insert
    await supabase.from('quiz_questions').delete().eq('assessment_id', assessmentId);

    const rows = questions.map((q, i) => ({
      assessment_id: assessmentId,
      question_text: q.question_text.trim(),
      option_a: q.option_a.trim(),
      option_b: q.option_b.trim(),
      option_c: q.option_c.trim(),
      option_d: q.option_d.trim(),
      correct_option: q.correct_option,
      marks: q.marks,
      question_order: i,
    }));

    const { error } = await supabase.from('quiz_questions').insert(rows);

    if (error) {
      toast.error('Failed to save questions');
      console.error(error);
    } else {
      toast.success('Quiz questions saved');
      onSaved?.();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">Quiz Questions</h3>
          <p className="text-xs text-muted-foreground">
            {questions.length} question{questions.length !== 1 ? 's' : ''} •
            Total: {currentTotalMarks}/{totalMarks} marks
            {currentTotalMarks !== totalMarks && (
              <span className="text-destructive ml-1">(must equal {totalMarks})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1 rounded-xl">
            <Plus className="w-4 h-4" /> Add Question
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 rounded-xl">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Questions'}
          </Button>
        </div>
      </div>

      {questions.map((q, i) => (
        <Card key={i} className="border border-border/50 bg-card/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <GripVertical className="w-4 h-4" />
                Q{i + 1}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Marks:</Label>
                <Input
                  type="number"
                  min={1}
                  value={q.marks}
                  onChange={e => updateQuestion(i, 'marks', parseInt(e.target.value) || 1)}
                  className="h-7 w-16 rounded-lg text-center text-sm"
                />
                {questions.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive"
                    onClick={() => removeQuestion(i)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              value={q.question_text}
              onChange={e => updateQuestion(i, 'question_text', e.target.value)}
              placeholder="Enter question text..."
              rows={2}
              className="resize-none rounded-xl text-sm"
            />

            <RadioGroup
              value={q.correct_option}
              onValueChange={v => updateQuestion(i, 'correct_option', v)}
              className="space-y-2"
            >
              {(['a', 'b', 'c', 'd'] as const).map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`q${i}-${opt}`} />
                  <Label htmlFor={`q${i}-${opt}`} className="text-xs font-semibold uppercase w-4">{opt}.</Label>
                  <Input
                    value={q[`option_${opt}`]}
                    onChange={e => updateQuestion(i, `option_${opt}`, e.target.value)}
                    placeholder={`Option ${opt.toUpperCase()}`}
                    className="h-8 rounded-lg text-sm flex-1"
                  />
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              ✓ Correct answer: Option {q.correct_option.toUpperCase()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
