import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, Trash2, Save, Upload, FileText, ClipboardList, BookOpen,
  GraduationCap, ChevronDown, ChevronRight, Eye, Paperclip, UserPlus,
} from 'lucide-react';
import { gsap } from 'gsap';

type AssessmentType = 'quiz' | 'assignment' | 'midterm' | 'final';

interface Assessment {
  id: string;
  teacher_id: string;
  course_code: string;
  course_name: string;
  assessment_type: AssessmentType;
  title: string;
  total_marks: number;
  file_path: string | null;
  created_at: string;
}

interface StudentMark {
  id: string;
  assessment_id: string;
  student_name: string;
  student_roll_number: string;
  marks_obtained: number | null;
  remarks: string | null;
  submission_file_path: string | null;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [marksMap, setMarksMap] = useState<Record<string, StudentMark[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTotalMarks, setNewTotalMarks] = useState('100');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Add student dialog
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentAssessmentId, setAddStudentAssessmentId] = useState<string | null>(null);
  const [addStudentName, setAddStudentName] = useState('');
  const [addStudentRoll, setAddStudentRoll] = useState('');
  const [addStudentIsHardCopy, setAddStudentIsHardCopy] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const courseName = courses.find(c => c.code === selectedCourse)?.name || '';

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
    } else {
      setAssessments((data as Assessment[]) || []);
    }
    setLoading(false);
  }, [selectedCourse, activeTab]);

  useEffect(() => {
    fetchAssessments();
    setExpandedId(null);
    setMarksMap({});
  }, [fetchAssessments]);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.animate-card');
      gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }
  }, [assessments, activeTab]);

  const fetchMarks = async (assessmentId: string) => {
    const { data, error } = await supabase
      .from('student_marks')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('student_roll_number', { ascending: true });

    if (error) {
      toast.error('Failed to load student data');
    } else {
      setMarksMap(prev => ({ ...prev, [assessmentId]: (data as StudentMark[]) || [] }));
    }
  };

  const toggleExpand = (assessmentId: string) => {
    if (expandedId === assessmentId) {
      setExpandedId(null);
    } else {
      setExpandedId(assessmentId);
      if (!marksMap[assessmentId]) {
        fetchMarks(assessmentId);
      }
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error('Please enter a title'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return; }

    setUploading(true);
    let filePath: string | null = null;

    // Upload PDF if provided
    if (newFile) {
      const ext = newFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${newTitle.trim().replace(/\s+/g, '-')}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('assessments')
        .upload(path, newFile, { contentType: newFile.type });

      if (uploadError) {
        toast.error('Failed to upload file');
        setUploading(false);
        return;
      }
      filePath = path;
    }

    const { data, error } = await supabase.from('assessments').insert({
      teacher_id: user.id,
      course_code: selectedCourse,
      course_name: courseName,
      assessment_type: activeTab,
      title: newTitle.trim(),
      total_marks: parseInt(newTotalMarks) || 100,
      file_path: filePath,
    }).select().single();

    if (error) {
      toast.error('Failed to create assessment');
      setUploading(false);
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
      submission_file_path: null,
    }));
    await supabase.from('student_marks').insert(studentRows);

    toast.success('Assessment created');
    setNewTitle('');
    setNewTotalMarks('100');
    setNewFile(null);
    setCreateOpen(false);
    setUploading(false);
    fetchAssessments();
  };

  const handleDelete = async (id: string) => {
    const assessment = assessments.find(a => a.id === id);
    // Delete storage file if exists
    if (assessment?.file_path) {
      await supabase.storage.from('assessments').remove([assessment.file_path]);
    }
    const { error } = await supabase.from('assessments').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Assessment deleted');
      if (expandedId === id) setExpandedId(null);
      fetchAssessments();
    }
  };

  const updateLocalMark = (assessmentId: string, markId: string, field: keyof StudentMark, value: string) => {
    setMarksMap(prev => ({
      ...prev,
      [assessmentId]: (prev[assessmentId] || []).map(m => {
        if (m.id !== markId) return m;
        if (field === 'marks_obtained') {
          return { ...m, marks_obtained: value === '' ? null : parseFloat(value) };
        }
        return { ...m, [field]: value || null };
      }),
    }));
  };

  const handleSaveMarks = async (assessment: Assessment) => {
    const assessmentMarks = marksMap[assessment.id] || [];
    setSaving(true);

    for (const mark of assessmentMarks) {
      if (mark.marks_obtained !== null && (mark.marks_obtained < 0 || mark.marks_obtained > assessment.total_marks)) {
        toast.error(`Invalid marks for ${mark.student_name}: must be 0-${assessment.total_marks}`);
        setSaving(false);
        return;
      }
    }

    let hasError = false;
    for (const mark of assessmentMarks) {
      const { error } = await supabase.from('student_marks').update({
        marks_obtained: mark.marks_obtained,
        remarks: mark.remarks,
        updated_at: new Date().toISOString(),
      }).eq('id', mark.id);
      if (error) hasError = true;
    }

    toast[hasError ? 'error' : 'success'](hasError ? 'Some marks failed to save' : 'All marks saved');
    setSaving(false);
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from('assessments').getPublicUrl(path);
    return data.publicUrl;
  };

  // Add student (manual / hard copy)
  const handleAddStudent = async () => {
    if (!addStudentName.trim() || !addStudentRoll.trim() || !addStudentAssessmentId) {
      toast.error('Name and roll number are required');
      return;
    }

    const { data, error } = await supabase.from('student_marks').insert({
      assessment_id: addStudentAssessmentId,
      student_name: addStudentName.trim(),
      student_roll_number: addStudentRoll.trim(),
      marks_obtained: null,
      remarks: addStudentIsHardCopy ? 'Hard copy submission' : null,
      submission_file_path: null,
    }).select().single();

    if (error) {
      if (error.code === '23505') {
        toast.error('This roll number already exists for this assessment');
      } else {
        toast.error('Failed to add student');
      }
      return;
    }

    setMarksMap(prev => ({
      ...prev,
      [addStudentAssessmentId]: [...(prev[addStudentAssessmentId] || []), data as StudentMark],
    }));

    toast.success('Student added');
    setAddStudentName('');
    setAddStudentRoll('');
    setAddStudentIsHardCopy(false);
    setAddStudentOpen(false);
  };

  const handleDeleteMark = async (assessmentId: string, markId: string) => {
    const { error } = await supabase.from('student_marks').delete().eq('id', markId);
    if (error) {
      toast.error('Failed to remove student');
    } else {
      setMarksMap(prev => ({
        ...prev,
        [assessmentId]: (prev[assessmentId] || []).filter(m => m.id !== markId),
      }));
    }
  };

  const submissionCount = (assessmentId: string) => {
    const marks = marksMap[assessmentId] || [];
    return marks.filter(m => m.submission_file_path || m.remarks?.includes('Hard copy')).length;
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
            <p className="text-muted-foreground">Create assessments, upload files, and manage student marks</p>
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
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{t.label} for {courseName}</h2>
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2 rounded-xl">
                        <Plus className="w-4 h-4" /> New {t.label.slice(0, -1)}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create {t.label.slice(0, -1)}</DialogTitle>
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
                        <div className="space-y-2">
                          <Label>Upload PDF <span className="text-muted-foreground text-xs">(optional)</span></Label>
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={e => setNewFile(e.target.files?.[0] || null)}
                            className="rounded-xl"
                          />
                          {newFile && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Paperclip className="w-3 h-3" /> {newFile.name}
                            </p>
                          )}
                        </div>
                        <Button onClick={handleCreate} disabled={uploading} className="w-full rounded-xl">
                          {uploading ? 'Uploading...' : 'Create'}
                        </Button>
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
                  <div className="space-y-3">
                    {assessments.map(a => {
                      const isExpanded = expandedId === a.id;
                      const marks = marksMap[a.id] || [];
                      const subs = submissionCount(a.id);

                      return (
                        <Collapsible key={a.id} open={isExpanded} onOpenChange={() => toggleExpand(a.id)}>
                          <Card className={`animate-card backdrop-blur border transition-all duration-200 ${isExpanded ? 'border-primary/50 bg-primary/5 shadow-lg' : 'border-border/50 bg-card/80 hover:shadow-md'}`}>
                            <CollapsibleTrigger asChild>
                              <CardContent className="p-4 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {isExpanded ? <ChevronDown className="w-5 h-5 text-primary shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold">{a.title}</h3>
                                        <Badge variant="outline" className="text-xs">{a.total_marks} marks</Badge>
                                        {a.file_path && (
                                          <Badge variant="secondary" className="text-xs gap-1">
                                            <Paperclip className="w-3 h-3" /> PDF
                                          </Badge>
                                        )}
                                        {isExpanded && subs > 0 && (
                                          <Badge className="text-xs">{subs} submission{subs > 1 ? 's' : ''}</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(a.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                    {a.file_path && (
                                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                        <a href={getFileUrl(a.file_path)} target="_blank" rel="noopener noreferrer">
                                          <Eye className="w-4 h-4" />
                                        </a>
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleDelete(a.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="px-4 pb-4 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <p className="text-sm text-muted-foreground">
                                    {marks.length} students
                                  </p>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="gap-1 rounded-xl"
                                      onClick={() => {
                                        setAddStudentAssessmentId(a.id);
                                        setAddStudentOpen(true);
                                      }}>
                                      <UserPlus className="w-4 h-4" /> Add Student
                                    </Button>
                                    <Button size="sm" onClick={() => handleSaveMarks(a)} disabled={saving} className="gap-1 rounded-xl">
                                      <Save className="w-4 h-4" />
                                      {saving ? 'Saving...' : 'Save All'}
                                    </Button>
                                  </div>
                                </div>

                                <div className="rounded-xl border overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <TableHead>Roll Number</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="w-[100px]">Marks</TableHead>
                                        <TableHead>Submission</TableHead>
                                        <TableHead>Remarks</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {marks.map((mark, i) => (
                                        <TableRow key={mark.id}>
                                          <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                                          <TableCell className="font-mono text-xs">{mark.student_roll_number}</TableCell>
                                          <TableCell className="text-sm">{mark.student_name}</TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              min={0}
                                              max={a.total_marks}
                                              value={mark.marks_obtained ?? ''}
                                              onChange={e => updateLocalMark(a.id, mark.id, 'marks_obtained', e.target.value)}
                                              className="h-8 w-20 rounded-lg text-center text-sm"
                                              placeholder="—"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            {mark.submission_file_path ? (
                                              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" asChild>
                                                <a href={getFileUrl(mark.submission_file_path)} target="_blank" rel="noopener noreferrer">
                                                  <Eye className="w-3 h-3" /> View
                                                </a>
                                              </Button>
                                            ) : mark.remarks?.includes('Hard copy') ? (
                                              <Badge variant="secondary" className="text-xs">Hard Copy</Badge>
                                            ) : (
                                              <span className="text-xs text-muted-foreground">Not submitted</span>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              value={mark.remarks ?? ''}
                                              onChange={e => updateLocalMark(a.id, mark.id, 'remarks', e.target.value)}
                                              className="h-8 rounded-lg text-sm"
                                              placeholder="Optional"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive"
                                              onClick={() => handleDeleteMark(a.id, mark.id)}>
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      {marks.length === 0 && (
                                        <TableRow>
                                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                                            No students yet. Click "Add Student" to begin.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Student Name</Label>
              <Input value={addStudentName} onChange={e => setAddStudentName(e.target.value)} placeholder="e.g. John Doe" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Roll Number</Label>
              <Input value={addStudentRoll} onChange={e => setAddStudentRoll(e.target.value)} placeholder="e.g. SP22-BCS-009" className="rounded-xl" />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hardcopy"
                checked={addStudentIsHardCopy}
                onChange={e => setAddStudentIsHardCopy(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="hardcopy" className="text-sm cursor-pointer">Hard copy submission</Label>
            </div>
            <Button onClick={handleAddStudent} className="w-full rounded-xl">Add Student</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TeacherLayout>
  );
};

export default TeacherUpload;
