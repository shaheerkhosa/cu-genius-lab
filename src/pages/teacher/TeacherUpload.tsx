import { useState, useEffect } from 'react';
import { TeacherLayout } from "@/components/TeacherLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Upload, FileText, ClipboardList, BookOpen, GraduationCap } from 'lucide-react';
import { useRef, useCallback } from 'react';
import { gsap } from 'gsap';

type AssessmentType = 'quiz' | 'assignment' | 'midterm' | 'final';

interface Assessment {
  id: string;
  course_code: string;
  course_name: string;
  assessment_type: AssessmentType;
  title: string;
  total_marks: number;
  created_at: string;
}

interface StudentMark {
  id: string;
  assessment_id: string;
  student_name: string;
  student_roll_number: string;
  marks_obtained: number | null;
  remarks: string | null;
}

const courses = [
  { code: 'CS403', name: 'Computer Networks' },
  { code: 'CS401', name: 'Software Engineering' },
  { code: 'CS402', name: 'Operating Systems' },
  { code: 'CS404', name: 'Artificial Intelligence' },
];

const tabConfig: { value: AssessmentType; label: string; icon: React.ReactNode }[] = [
  { value: 'quiz', label: 'Quizzes', icon: <ClipboardList className="w-4 h-4" /> },
  { value: 'assignment', label: 'Assignments', icon: <FileText className="w-4 h-4" /> },
  { value: 'midterm', label: 'Midterms', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'final', label: 'Finals', icon: <GraduationCap className="w-4 h-4" /> },
];

// Default students for new assessments
const defaultStudents = [
  { name: 'Ahmed Khan', roll: 'SP22-BCS-001' },
  { name: 'Sara Ali', roll: 'SP22-BCS-002' },
  { name: 'Usman Tariq', roll: 'SP22-BCS-003' },
  { name: 'Fatima Zahra', roll: 'SP22-BCS-004' },
  { name: 'Hassan Raza', roll: 'SP22-BCS-005' },
  { name: 'Ayesha Noor', roll: 'SP22-BCS-006' },
  { name: 'Bilal Saeed', roll: 'SP22-BCS-007' },
  { name: 'Zainab Malik', roll: 'SP22-BCS-008' },
];

const TeacherUpload = () => {
  const [activeTab, setActiveTab] = useState<AssessmentType>('quiz');
  const [selectedCourse, setSelectedCourse] = useState(courses[0].code);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTotalMarks, setNewTotalMarks] = useState('100');
  const containerRef = useRef<HTMLDivElement>(null);

  const courseName = courses.find(c => c.code === selectedCourse)?.name || '';

  // Fetch assessments
  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('course_code', selectedCourse)
      .eq('assessment_type', activeTab)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load assessments');
      console.error(error);
    } else {
      setAssessments((data as Assessment[]) || []);
    }
    setLoading(false);
  }, [selectedCourse, activeTab]);

  useEffect(() => {
    fetchAssessments();
    setSelectedAssessment(null);
    setMarks([]);
  }, [fetchAssessments]);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.animate-card');
      gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }
  }, [assessments, activeTab]);

  // Fetch marks for selected assessment
  const fetchMarks = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    const { data, error } = await supabase
      .from('student_marks')
      .select('*')
      .eq('assessment_id', assessment.id)
      .order('student_roll_number', { ascending: true });

    if (error) {
      toast.error('Failed to load marks');
    } else {
      setMarks((data as StudentMark[]) || []);
    }
  };

  // Create new assessment with default students
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return; }

    const { data, error } = await supabase.from('assessments').insert({
      teacher_id: user.id,
      course_code: selectedCourse,
      course_name: courseName,
      assessment_type: activeTab,
      title: newTitle.trim(),
      total_marks: parseInt(newTotalMarks) || 100,
    }).select().single();

    if (error) {
      toast.error('Failed to create assessment');
      console.error(error);
      return;
    }

    const assessment = data as Assessment;

    // Insert default students
    const studentRows = defaultStudents.map(s => ({
      assessment_id: assessment.id,
      student_name: s.name,
      student_roll_number: s.roll,
      marks_obtained: null,
      remarks: null,
    }));

    await supabase.from('student_marks').insert(studentRows);

    toast.success('Assessment created');
    setNewTitle('');
    setNewTotalMarks('100');
    setCreateOpen(false);
    fetchAssessments();
  };

  // Delete assessment
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('assessments').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Assessment deleted');
      if (selectedAssessment?.id === id) {
        setSelectedAssessment(null);
        setMarks([]);
      }
      fetchAssessments();
    }
  };

  // Update a single mark in local state
  const updateLocalMark = (markId: string, field: 'marks_obtained' | 'remarks', value: string) => {
    setMarks(prev => prev.map(m => {
      if (m.id !== markId) return m;
      if (field === 'marks_obtained') {
        const num = value === '' ? null : parseFloat(value);
        return { ...m, marks_obtained: num };
      }
      return { ...m, remarks: value || null };
    }));
  };

  // Save all marks
  const handleSaveMarks = async () => {
    if (!selectedAssessment) return;
    setSaving(true);

    // Validate marks
    for (const mark of marks) {
      if (mark.marks_obtained !== null && (mark.marks_obtained < 0 || mark.marks_obtained > selectedAssessment.total_marks)) {
        toast.error(`Invalid marks for ${mark.student_name}: must be 0-${selectedAssessment.total_marks}`);
        setSaving(false);
        return;
      }
    }

    let hasError = false;
    for (const mark of marks) {
      const { error } = await supabase.from('student_marks').update({
        marks_obtained: mark.marks_obtained,
        remarks: mark.remarks,
        updated_at: new Date().toISOString(),
      }).eq('id', mark.id);
      if (error) { hasError = true; console.error(error); }
    }

    if (hasError) {
      toast.error('Some marks failed to save');
    } else {
      toast.success('All marks saved successfully');
    }
    setSaving(false);
  };

  // Add a student row
  const handleAddStudent = async () => {
    if (!selectedAssessment) return;
    const { data, error } = await supabase.from('student_marks').insert({
      assessment_id: selectedAssessment.id,
      student_name: 'New Student',
      student_roll_number: `SP22-BCS-${String(marks.length + 1).padStart(3, '0')}`,
      marks_obtained: null,
      remarks: null,
    }).select().single();

    if (error) {
      toast.error('Failed to add student');
    } else {
      setMarks(prev => [...prev, data as StudentMark]);
    }
  };

  return (
    <TeacherLayout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />

        <div ref={containerRef} className="relative z-10 max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="animate-card text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Upload className="w-4 h-4" />
              Assessment Management
            </div>
            <h1 className="text-4xl font-bold text-foreground">Upload & Marks</h1>
            <p className="text-muted-foreground">Create assessments and manage student marks</p>
          </div>

          {/* Course Selector */}
          <div className="animate-card flex justify-center">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[320px] rounded-xl h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as AssessmentType)}>
            <TabsList className="animate-card grid w-full grid-cols-4 h-12 rounded-xl">
              {tabConfig.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="rounded-lg gap-2 text-sm">
                  {t.icon} {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabConfig.map(t => (
              <TabsContent key={t.value} value={t.value} className="space-y-4 mt-4">
                {/* Assessment List + Create */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{t.label} for {courseName}</h2>
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2 rounded-xl">
                        <Plus className="w-4 h-4" /> New {t.label.slice(0, -1) /* remove trailing 's' */}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create {t.label.slice(0, -1))}  </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={`e.g. ${t.label.slice(0, -1)} 1`} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Total Marks</Label>
                          <Input type="number" value={newTotalMarks} onChange={e => setNewTotalMarks(e.target.value)} placeholder="100" className="rounded-xl" />
                        </div>
                        <Button onClick={handleCreate} className="w-full rounded-xl">Create</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : assessments.length === 0 ? (
                  <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No {t.label.toLowerCase()} created yet for this course.</p>
                      <p className="text-sm mt-1">Click "New {t.label.slice(0, -1)}" to get started.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assessments.map(a => (
                      <Card
                        key={a.id}
                        className={`animate-card backdrop-blur border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                          selectedAssessment?.id === a.id
                            ? 'border-primary/50 bg-primary/5 shadow-lg'
                            : 'border-border/50 bg-card/80'
                        }`}
                        onClick={() => fetchMarks(a)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{a.title}</h3>
                            <p className="text-sm text-muted-foreground">Total: {a.total_marks} marks</p>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive"
                            onClick={e => { e.stopPropagation(); handleDelete(a.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Marks Table */}
                {selectedAssessment && (
                  <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <CardTitle>{selectedAssessment.title} — Marks Entry</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Total Marks: {selectedAssessment.total_marks} • {marks.length} students
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleAddStudent} className="gap-1 rounded-xl">
                            <Plus className="w-4 h-4" /> Add Student
                          </Button>
                          <Button size="sm" onClick={handleSaveMarks} disabled={saving} className="gap-1 rounded-xl">
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save All'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[60px]">#</TableHead>
                              <TableHead>Roll Number</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead className="w-[120px]">Marks</TableHead>
                              <TableHead>Remarks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {marks.map((mark, i) => (
                              <TableRow key={mark.id}>
                                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                <TableCell className="font-mono text-sm">{mark.student_roll_number}</TableCell>
                                <TableCell>{mark.student_name}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={selectedAssessment.total_marks}
                                    value={mark.marks_obtained ?? ''}
                                    onChange={e => updateLocalMark(mark.id, 'marks_obtained', e.target.value)}
                                    className="h-8 w-20 rounded-lg text-center"
                                    placeholder="—"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={mark.remarks ?? ''}
                                    onChange={e => updateLocalMark(mark.id, 'remarks', e.target.value)}
                                    className="h-8 rounded-lg"
                                    placeholder="Optional"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                            {marks.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  No students added yet. Click "Add Student" to begin.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherUpload;
