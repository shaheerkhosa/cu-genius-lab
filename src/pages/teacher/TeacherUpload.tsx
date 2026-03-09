import { useState, useEffect, useCallback, useRef } from 'react';
import { TeacherLayout } from "@/components/TeacherLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QuizBuilder } from "@/components/QuizBuilder";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, Trash2, Save, Upload, FileText, ClipboardList, BookOpen,
  GraduationCap, ChevronDown, ChevronRight, Eye, Paperclip, UserPlus,
  Clock, Wifi, CheckCircle, Users,
} from 'lucide-react';
import { gsap } from 'gsap';

type AssessmentType = 'quiz' | 'assignment' | 'midterm' | 'final' | 'attendance';

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
  schedule_start: string | null;
  schedule_end: string | null;
  is_online_quiz: boolean;
  is_marks_finalized: boolean;
}

interface StudentMark {
  id: string;
  assessment_id: string;
  student_name: string;
  student_roll_number: string;
  marks_obtained: number | null;
  remarks: string | null;
  submission_file_path: string | null;
  student_id: string | null;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  marks: number;
  question_order: number;
}

interface Enrollment {
  id: string;
  student_id: string;
  course_code: string;
  student_name?: string;
  student_email?: string;
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
  { value: 'attendance', label: 'Attendance', icon: <Users className="w-4 h-4" /> },
];

// No more hardcoded students - we pull from course_enrollments

const TeacherUpload = () => {
  const [activeTab, setActiveTab] = useState<AssessmentType>('quiz');
  const [selectedCourse, setSelectedCourse] = useState(courses[0].code);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [marksMap, setMarksMap] = useState<Record<string, StudentMark[]>>({});
  const [questionsMap, setQuestionsMap] = useState<Record<string, QuizQuestion[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTotalMarks, setNewTotalMarks] = useState('100');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newIsOnlineQuiz, setNewIsOnlineQuiz] = useState(false);
  const [newIsOnlineAssignment, setNewIsOnlineAssignment] = useState(false);
  const [newScheduleStart, setNewScheduleStart] = useState('');
  const [newDurationMinutes, setNewDurationMinutes] = useState('30');
  const [newDeadline, setNewDeadline] = useState('');
  const [newCourseCode, setNewCourseCode] = useState(courses[0].code);

  // Add student dialog
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentAssessmentId, setAddStudentAssessmentId] = useState<string | null>(null);
  const [addStudentName, setAddStudentName] = useState('');
  const [addStudentRoll, setAddStudentRoll] = useState('');
  const [addStudentIsHardCopy, setAddStudentIsHardCopy] = useState(false);

  // Enrollment dialog
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [attendanceRecords, setAttendanceRecords] = useState<{ student_id: string; student_name: string; student_email: string; status: string }[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [screenshotParsing, setScreenshotParsing] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const courseName = courses.find(c => c.code === selectedCourse)?.name || '';

  const computeEndTime = (start: string, durationMin: string) => {
    if (!start) return '';
    const d = new Date(start);
    d.setMinutes(d.getMinutes() + (parseInt(durationMin) || 30));
    return d.toISOString();
  };

  const fetchAssessments = useCallback(async () => {
    if (activeTab === 'attendance') { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('course_code', selectedCourse)
      .eq('assessment_type', activeTab)
      .order('created_at', { ascending: true });

    if (error) toast.error('Failed to load assessments');
    else setAssessments((data as Assessment[]) || []);
    setLoading(false);
  }, [selectedCourse, activeTab]);

  useEffect(() => {
    fetchAssessments();
    setExpandedId(null);
    setMarksMap({});
    setQuestionsMap({});
  }, [fetchAssessments]);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.animate-card');
      gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }
  }, [assessments, activeTab]);

  const fetchMarks = async (assessmentId: string) => {
    const { data } = await supabase.from('student_marks').select('*')
      .eq('assessment_id', assessmentId).order('student_roll_number');
    setMarksMap(prev => ({ ...prev, [assessmentId]: (data as StudentMark[]) || [] }));
  };

  const fetchQuestions = async (assessmentId: string) => {
    const { data } = await supabase.from('quiz_questions').select('*')
      .eq('assessment_id', assessmentId).order('question_order');
    setQuestionsMap(prev => ({ ...prev, [assessmentId]: (data as QuizQuestion[]) || [] }));
  };

  const fetchEnrollments = async () => {
    const { data } = await supabase.from('course_enrollments').select('*')
      .eq('course_code', selectedCourse);
    if (!data || data.length === 0) { setEnrollments([]); return; }
    
    // Fetch profiles for enrolled students
    const studentIds = data.map(e => e.student_id);
    const { data: profiles } = await supabase.from('profiles').select('id, username, email').in('id', studentIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    
    const enriched: Enrollment[] = data.map(e => ({
      id: e.id,
      student_id: e.student_id,
      course_code: e.course_code,
      student_name: profileMap.get(e.student_id)?.username || 'Unknown',
      student_email: profileMap.get(e.student_id)?.email || '',
    }));
    setEnrollments(enriched);
  };

  const toggleExpand = (a: Assessment) => {
    if (expandedId === a.id) {
      setExpandedId(null);
    } else {
      setExpandedId(a.id);
      if (!marksMap[a.id]) fetchMarks(a.id);
      if (a.is_online_quiz) fetchQuestions(a.id);
    }
  };

  const resetCreateForm = () => {
    setNewTitle('');
    setNewTotalMarks('100');
    setNewFile(null);
    setNewIsOnlineQuiz(false);
    setNewIsOnlineAssignment(false);
    setNewScheduleStart('');
    setNewDurationMinutes('30');
    setNewDeadline('');
    setNewCourseCode(selectedCourse);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error('Please enter a title'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return; }

    const isQuizTab = activeTab === 'quiz';
    const isAssignmentTab = activeTab === 'assignment';
    const isExamTab = activeTab === 'midterm' || activeTab === 'final';

    // Validate schedule for online quizzes
    if (isQuizTab && newIsOnlineQuiz && !newScheduleStart) {
      toast.error('Start time is required for online quizzes');
      return;
    }

    // Validate deadline for assignments
    if (isAssignmentTab && !newDeadline) {
      toast.error('Deadline is required for assignments');
      return;
    }

    // PDF required for non-online assessments
    if (isQuizTab && !newIsOnlineQuiz && !newFile) {
      toast.error('PDF upload is required for paper-based quizzes');
      return;
    }
    if (isAssignmentTab && !newIsOnlineAssignment && !newFile) {
      toast.error('PDF upload is required for paper-based assignments');
      return;
    }
    if (isExamTab && !newFile) {
      toast.error('PDF upload is required');
      return;
    }

    const scheduleEnd = isQuizTab && newIsOnlineQuiz && newScheduleStart
      ? computeEndTime(newScheduleStart, newDurationMinutes)
      : isAssignmentTab && newDeadline
        ? new Date(newDeadline).toISOString()
        : null;

    setUploading(true);
    let filePath: string | null = null;

    if (newFile) {
      const ext = newFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${newTitle.trim().replace(/\s+/g, '-')}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('assessments').upload(path, newFile, { contentType: newFile.type });
      if (uploadError) { toast.error('Failed to upload file'); setUploading(false); return; }
      filePath = path;
    }

    const { data, error } = await supabase.from('assessments').insert({
      teacher_id: user.id,
      course_code: newCourseCode,
      course_name: courses.find(c => c.code === newCourseCode)?.name || '',
      assessment_type: activeTab,
      title: newTitle.trim(),
      total_marks: parseInt(newTotalMarks) || 100,
      file_path: filePath,
      is_online_quiz: (isQuizTab && newIsOnlineQuiz) || (isAssignmentTab && newIsOnlineAssignment),
      schedule_start: isQuizTab && newIsOnlineQuiz ? newScheduleStart : null,
      schedule_end: scheduleEnd,
      is_marks_finalized: false,
    }).select().single();

    if (error) { toast.error('Failed to create assessment'); setUploading(false); return; }

    // Auto-populate marks from enrolled students for non-online assessments
    if (!((isQuizTab && newIsOnlineQuiz) || (isAssignmentTab && newIsOnlineAssignment))) {
      // Fetch enrolled students for this course
      const { data: enrolled } = await supabase
        .from('course_enrollments')
        .select('student_id')
        .eq('course_code', newCourseCode);

      if (enrolled && enrolled.length > 0) {
        // Fetch profiles for enrolled students
        const studentIds = enrolled.map(e => e.student_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', studentIds);

        const studentRows = (profiles || []).map((p, i) => ({
          assessment_id: (data as Assessment).id,
          student_name: p.username,
          student_roll_number: p.email,
          student_id: p.id,
          marks_obtained: null,
          remarks: null,
        }));
        if (studentRows.length > 0) {
          await supabase.from('student_marks').insert(studentRows);
        }
      }
    }

    toast.success('Assessment created');
    resetCreateForm();
    setCreateOpen(false);
    setUploading(false);
    fetchAssessments();
  };

  const handleDelete = async (id: string) => {
    const a = assessments.find(x => x.id === id);
    if (a?.file_path) await supabase.storage.from('assessments').remove([a.file_path]);
    const { error } = await supabase.from('assessments').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Assessment deleted');
      if (expandedId === id) setExpandedId(null);
      fetchAssessments();
    }
  };

  const updateLocalMark = (assessmentId: string, markId: string, field: string, value: string) => {
    setMarksMap(prev => ({
      ...prev,
      [assessmentId]: (prev[assessmentId] || []).map(m => {
        if (m.id !== markId) return m;
        if (field === 'marks_obtained') return { ...m, marks_obtained: value === '' ? null : parseFloat(value) };
        return { ...m, [field]: value || null };
      }),
    }));
  };

  const handleSaveMarks = async (assessment: Assessment) => {
    const marks = marksMap[assessment.id] || [];
    setSaving(true);
    for (const mark of marks) {
      if (mark.marks_obtained !== null && (mark.marks_obtained < 0 || mark.marks_obtained > assessment.total_marks)) {
        toast.error(`Marks for ${mark.student_name} must be 0–${assessment.total_marks}`);
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
      if (error) hasError = true;
    }
    toast[hasError ? 'error' : 'success'](hasError ? 'Some marks failed to save' : 'All marks saved');
    setSaving(false);
  };

  const handleFinalizeMarks = async (assessment: Assessment) => {
    await handleSaveMarks(assessment);
    const { error } = await supabase.from('assessments').update({ is_marks_finalized: true }).eq('id', assessment.id);
    if (error) toast.error('Failed to finalize');
    else {
      toast.success('Marks finalized');
      fetchAssessments();
    }
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from('assessments').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAddStudent = async () => {
    if (!addStudentName.trim() || !addStudentRoll.trim() || !addStudentAssessmentId) {
      toast.error('Name and roll number are required'); return;
    }
    const { data, error } = await supabase.from('student_marks').insert({
      assessment_id: addStudentAssessmentId,
      student_name: addStudentName.trim(),
      student_roll_number: addStudentRoll.trim(),
      marks_obtained: null,
      remarks: addStudentIsHardCopy ? 'Hard copy submission' : null,
    }).select().single();
    if (error) {
      toast.error(error.code === '23505' ? 'Roll number already exists' : 'Failed to add student');
      return;
    }
    setMarksMap(prev => ({
      ...prev,
      [addStudentAssessmentId!]: [...(prev[addStudentAssessmentId!] || []), data as StudentMark],
    }));
    toast.success('Student added');
    setAddStudentName(''); setAddStudentRoll(''); setAddStudentIsHardCopy(false); setAddStudentOpen(false);
  };

  const handleDeleteMark = async (assessmentId: string, markId: string) => {
    const { error } = await supabase.from('student_marks').delete().eq('id', markId);
    if (!error) setMarksMap(prev => ({ ...prev, [assessmentId]: (prev[assessmentId] || []).filter(m => m.id !== markId) }));
  };

  const handleEnrollStudent = async () => {
    if (!enrollEmail.trim()) { toast.error('Email is required'); return; }
    // Find user by email in profiles
    const { data: profile } = await supabase.from('profiles').select('id, username, email').eq('email', enrollEmail.trim()).maybeSingle();
    if (!profile) { toast.error('No user found with that email'); return; }

    const { error } = await supabase.from('course_enrollments').insert({
      student_id: profile.id,
      course_code: selectedCourse,
    });
    if (error) {
      toast.error(error.code === '23505' ? 'Student already enrolled' : 'Failed to enroll');
      return;
    }
    toast.success(`${profile.username} enrolled in ${selectedCourse}`);
    setEnrollEmail('');
    fetchEnrollments();
  };

  const handleUnenroll = async (enrollmentId: string) => {
    await supabase.from('course_enrollments').delete().eq('id', enrollmentId);
    fetchEnrollments();
  };

  // ─── Attendance ───
  const fetchAttendanceForDate = async () => {
    setAttendanceLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAttendanceLoading(false); return; }

    // Get enrolled students
    const { data: enrolled } = await supabase.from('course_enrollments').select('student_id').eq('course_code', selectedCourse);
    if (!enrolled || enrolled.length === 0) { setAttendanceRecords([]); setAttendanceLoading(false); return; }

    const studentIds = enrolled.map(e => e.student_id);
    const { data: profiles } = await supabase.from('profiles').select('id, username, email').in('id', studentIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const dateOnly = attendanceDate.slice(0, 10);

    // Check existing attendance for this date
    const { data: existing } = await supabase.from('attendance').select('*')
      .eq('course_code', selectedCourse)
      .eq('date', dateOnly);

    const existingMap = new Map((existing || []).map(a => [a.student_id, a.status]));

    const records = studentIds.map(sid => ({
      student_id: sid,
      student_name: profileMap.get(sid)?.username || 'Unknown',
      student_email: profileMap.get(sid)?.email || '',
      status: existingMap.get(sid) || 'present',
    }));

    setAttendanceRecords(records);
    setAttendanceLoading(false);
  };

  const handleSaveAttendance = async () => {
    setAttendanceSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAttendanceSaving(false); return; }

    const dateOnly = attendanceDate.slice(0, 10);

    // Delete existing records for this date/course
    await supabase.from('attendance').delete()
      .eq('course_code', selectedCourse)
      .eq('date', dateOnly)
      .eq('teacher_id', user.id);

    // Insert new records
    const rows = attendanceRecords.map(r => ({
      course_code: selectedCourse,
      student_id: r.student_id,
      teacher_id: user.id,
      date: dateOnly,
      status: r.status,
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from('attendance').insert(rows);
      if (error) { toast.error('Failed to save attendance'); setAttendanceSaving(false); return; }
    }

    toast.success('Attendance saved');
    setAttendanceSaving(false);
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceForDate();
    }
  }, [activeTab, selectedCourse, attendanceDate]);

  const updateAttendanceStatus = (studentId: string, status: string) => {
    setAttendanceRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r));
  };

  const handleScreenshotUpload = async () => {
    if (!screenshotFile || attendanceRecords.length === 0) {
      toast.error('Please select a screenshot and ensure students are loaded');
      return;
    }

    setScreenshotParsing(true);

    try {
      // Convert image to base64
      const arrayBuffer = await screenshotFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      const enrolled_students = attendanceRecords.map(r => ({
        student_id: r.student_id,
        student_name: r.student_name,
        student_email: r.student_email,
      }));

      const response = await supabase.functions.invoke('parse-attendance', {
        body: { image_base64: base64, enrolled_students },
      });

      if (response.error) {
        toast.error('Failed to analyze screenshot');
        setScreenshotParsing(false);
        return;
      }

      const data = response.data;
      if (data?.attendance && Array.isArray(data.attendance)) {
        let matched = 0;
        setAttendanceRecords(prev => prev.map(r => {
          const match = data.attendance.find((a: any) => a.student_id === r.student_id);
          if (match) {
            matched++;
            return { ...r, status: match.status };
          }
          return r;
        }));
        toast.success(`AI detected ${matched} students from screenshot`);
      } else {
        toast.error('Could not parse attendance from screenshot');
      }
    } catch (e) {
      console.error('Screenshot parse error:', e);
      toast.error('Failed to process screenshot');
    }

    setScreenshotParsing(false);
    setScreenshotFile(null);
  };

  const getScheduleStatus = (a: Assessment) => {
    if (!a.schedule_start || !a.schedule_end) return null;
    const now = new Date();
    const start = new Date(a.schedule_start);
    const end = new Date(a.schedule_end);
    if (now < start) return 'scheduled';
    if (now >= start && now <= end) return 'live';
    return 'ended';
  };

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDurationLabel = (a: Assessment) => {
    if (!a.schedule_start || !a.schedule_end) return '';
    const diff = new Date(a.schedule_end).getTime() - new Date(a.schedule_start).getTime();
    const mins = Math.round(diff / 60000);
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m`;
  };

  // Render helpers
  const renderCreateDialog = (tabLabel: string) => {
    const singular = tabLabel.slice(0, -1);
    const isQuizTab = activeTab === 'quiz';
    const isAssignmentTab = activeTab === 'assignment';
    const isExamTab = activeTab === 'midterm' || activeTab === 'final';
    const pdfRequired = isQuizTab ? !newIsOnlineQuiz : isAssignmentTab ? !newIsOnlineAssignment : true;

    return (
      <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) resetCreateForm(); }}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> New {singular}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create {singular}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={`e.g. ${singular} 1`} className="rounded-xl" />
            </div>

            {/* Course selector */}
            <div className="space-y-2">
              <Label>Course / Class</Label>
              <Select value={newCourseCode} onValueChange={setNewCourseCode}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Total Marks</Label>
              <Input type="number" value={newTotalMarks} onChange={e => setNewTotalMarks(e.target.value)} placeholder="100" className="rounded-xl" />
            </div>

            {/* Online quiz toggle (quiz tab only) */}
            {isQuizTab && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div>
                  <Label className="text-sm font-medium">Online Quiz</Label>
                  <p className="text-xs text-muted-foreground">Students take this quiz in-app</p>
                </div>
                <Switch checked={newIsOnlineQuiz} onCheckedChange={setNewIsOnlineQuiz} />
              </div>
            )}

            {/* Online assignment toggle (assignment tab only) */}
            {isAssignmentTab && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div>
                  <Label className="text-sm font-medium">Online Submission</Label>
                  <p className="text-xs text-muted-foreground">Students submit answers online for you to review</p>
                </div>
                <Switch checked={newIsOnlineAssignment} onCheckedChange={setNewIsOnlineAssignment} />
              </div>
            )}

            {/* Schedule (online quiz only) */}
            {isQuizTab && newIsOnlineQuiz && (
              <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Schedule
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Time</Label>
                    <Input type="datetime-local" value={newScheduleStart} onChange={e => setNewScheduleStart(e.target.value)} className="rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration (minutes)</Label>
                    <Input type="number" min={5} value={newDurationMinutes} onChange={e => setNewDurationMinutes(e.target.value)} className="rounded-lg text-sm" placeholder="30" />
                  </div>
                </div>
                {newScheduleStart && newDurationMinutes && (
                  <p className="text-xs text-muted-foreground">
                    End time: {new Date(computeEndTime(newScheduleStart, newDurationMinutes)).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )}

            {/* Deadline (assignment tab) */}
            {isAssignmentTab && (
              <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Deadline <span className="text-destructive text-xs">*required</span>
                </Label>
                <Input type="datetime-local" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className="rounded-lg text-sm" />
              </div>
            )}

            {/* File upload */}
            <div className="space-y-2">
              <Label>
                Upload PDF
                {pdfRequired ? <span className="text-destructive text-xs ml-1">*required</span> : <span className="text-muted-foreground text-xs ml-1">(optional)</span>}
              </Label>
              <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setNewFile(e.target.files?.[0] || null)} className="rounded-xl" />
              {newFile && <p className="text-xs text-muted-foreground flex items-center gap-1"><Paperclip className="w-3 h-3" /> {newFile.name}</p>}
            </div>

            <Button onClick={handleCreate} disabled={uploading} className="w-full rounded-xl">
              {uploading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderMarksTable = (a: Assessment) => {
    const marks = marksMap[a.id] || [];
    const scoredMarks = marks.filter(m => m.marks_obtained !== null).map(m => m.marks_obtained as number);
    const avg = scoredMarks.length > 0 ? (scoredMarks.reduce((s, v) => s + v, 0) / scoredMarks.length).toFixed(1) : '—';
    const highest = scoredMarks.length > 0 ? Math.max(...scoredMarks) : '—';
    const lowest = scoredMarks.length > 0 ? Math.min(...scoredMarks) : '—';

    return (
      <div className="space-y-3">
        {/* Stats summary */}
        {scoredMarks.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-xs text-muted-foreground">Avg:</span>
              <span className="text-sm font-semibold">{avg}/{a.total_marks}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="text-xs text-muted-foreground">Highest:</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">{highest}/{a.total_marks}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-xs text-muted-foreground">Lowest:</span>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">{lowest}/{a.total_marks}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">{marks.length} students</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 rounded-xl"
              onClick={() => { setAddStudentAssessmentId(a.id); setAddStudentOpen(true); }}>
              <UserPlus className="w-4 h-4" /> Add Student
            </Button>
            <Button size="sm" onClick={() => handleSaveMarks(a)} disabled={saving} className="gap-1 rounded-xl">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
            </Button>
            {(a.assessment_type === 'midterm' || a.assessment_type === 'final') && !a.is_marks_finalized && (
              <Button size="sm" variant="default" onClick={() => handleFinalizeMarks(a)} className="gap-1 rounded-xl">
                <CheckCircle className="w-4 h-4" /> Finalize
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[120px]">Marks (/{a.total_marks})</TableHead>
                {a.assessment_type === 'assignment' && <TableHead>Submission</TableHead>}
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
                      onChange={e => {
                        const val = e.target.value;
                        if (val !== '' && parseFloat(val) > a.total_marks) {
                          toast.error(`Maximum marks: ${a.total_marks}`);
                          return;
                        }
                        updateLocalMark(a.id, mark.id, 'marks_obtained', val);
                      }}
                      className="h-8 w-20 rounded-lg text-center text-sm"
                      placeholder="—"
                      disabled={a.is_marks_finalized}
                    />
                  </TableCell>
                  {a.assessment_type === 'assignment' && (
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
                  )}
                  <TableCell>
                    <Input
                      value={mark.remarks ?? ''}
                      onChange={e => updateLocalMark(a.id, mark.id, 'remarks', e.target.value)}
                      className="h-8 rounded-lg text-sm"
                      placeholder="Optional"
                      disabled={a.is_marks_finalized}
                    />
                  </TableCell>
                  <TableCell>
                    {!a.is_marks_finalized && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive"
                        onClick={() => handleDeleteMark(a.id, mark.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {marks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={a.assessment_type === 'assignment' ? 7 : 6} className="text-center py-8 text-muted-foreground text-sm">
                    No students yet. Click "Add Student" to begin.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
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

          {/* Course Selector + Enrollment */}
          <div className="animate-card flex justify-center gap-3 items-center">
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
            <Dialog open={enrollOpen} onOpenChange={o => { setEnrollOpen(o); if (o) fetchEnrollments(); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl h-12">
                  <Users className="w-4 h-4" /> Manage Students
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Students Enrolled in {selectedCourse}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="flex gap-2">
                    <Input value={enrollEmail} onChange={e => setEnrollEmail(e.target.value)} placeholder="Student email address" className="rounded-xl flex-1" />
                    <Button onClick={handleEnrollStudent} className="rounded-xl">Enroll</Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {enrollments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No students enrolled yet.</p>
                    ) : (
                      enrollments.map(e => (
                        <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{e.student_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{e.student_email}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive shrink-0" onClick={() => handleUnenroll(e.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as AssessmentType)}>
            <TabsList className="animate-card grid w-full grid-cols-5 h-12 rounded-xl">
              {tabConfig.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="rounded-lg gap-2 text-sm">
                  {t.icon} {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabConfig.filter(t => t.value !== 'attendance').map(t => (
              <TabsContent key={t.value} value={t.value} className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{t.label} for {courseName}</h2>
                  {renderCreateDialog(t.label)}
                </div>

                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : assessments.length === 0 ? (
                  <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No {t.label.toLowerCase()} created yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {assessments.map(a => {
                      const isExpanded = expandedId === a.id;
                      const scheduleStatus = getScheduleStatus(a);

                      return (
                        <Collapsible key={a.id} open={isExpanded} onOpenChange={() => toggleExpand(a)}>
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
                                        {a.file_path && <Badge variant="secondary" className="text-xs gap-1"><Paperclip className="w-3 h-3" /> PDF</Badge>}
                                        {a.is_online_quiz && a.assessment_type === 'quiz' && <Badge className="text-xs gap-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 border-0"><Wifi className="w-3 h-3" /> Online</Badge>}
                                        {a.is_online_quiz && a.assessment_type === 'assignment' && <Badge className="text-xs gap-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 border-0"><Wifi className="w-3 h-3" /> Online Submission</Badge>}
                                        {a.assessment_type === 'assignment' && a.schedule_end && (
                                          <Badge variant={new Date(a.schedule_end) < new Date() ? 'destructive' : 'secondary'} className="text-xs gap-1">
                                            <Clock className="w-3 h-3" /> Due {formatDateTime(a.schedule_end)}
                                          </Badge>
                                        )}
                                        {scheduleStatus === 'live' && a.assessment_type !== 'assignment' && <Badge className="text-xs gap-1 bg-green-500/20 text-green-600 dark:text-green-400 border-0">● Live</Badge>}
                                        {scheduleStatus === 'scheduled' && a.assessment_type !== 'assignment' && <Badge variant="secondary" className="text-xs gap-1"><Clock className="w-3 h-3" /> Scheduled</Badge>}
                                        {scheduleStatus === 'ended' && a.assessment_type !== 'assignment' && <Badge variant="secondary" className="text-xs">Ended</Badge>}
                                        {a.is_marks_finalized && <Badge className="text-xs gap-1 bg-green-500/20 text-green-600 dark:text-green-400 border-0"><CheckCircle className="w-3 h-3" /> Finalized</Badge>}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {a.course_code} • {new Date(a.created_at).toLocaleDateString()}
                                        {a.schedule_start && a.schedule_end && (
                                          <span> • {formatDateTime(a.schedule_start)} ({getDurationLabel(a)})</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                    {a.file_path && (
                                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                        <a href={getFileUrl(a.file_path)} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4" /></a>
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleDelete(a.id)}><Trash2 className="w-4 h-4" /></Button>
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="px-4 pb-4 space-y-4">
                                {a.is_online_quiz && a.assessment_type === 'quiz' && (
                                  <QuizBuilder
                                    assessmentId={a.id}
                                    totalMarks={a.total_marks}
                                    existingQuestions={questionsMap[a.id] || []}
                                    onSaved={() => fetchQuestions(a.id)}
                                  />
                                )}
                                {a.is_online_quiz && a.assessment_type === 'assignment' && (
                                  <QuizBuilder
                                    assessmentId={a.id}
                                    totalMarks={a.total_marks}
                                    existingQuestions={questionsMap[a.id] || []}
                                    onSaved={() => fetchQuestions(a.id)}
                                  />
                                )}
                                {!a.is_online_quiz && renderMarksTable(a)}
                                {a.is_online_quiz && a.assessment_type === 'quiz' && getScheduleStatus(a) === 'ended' && (
                                  <div className="pt-4 border-t border-border/50">
                                    <h4 className="font-semibold text-sm mb-2">Student Results (auto-graded)</h4>
                                    <p className="text-xs text-muted-foreground mb-3">Online quiz results are automatically calculated from student responses.</p>
                                  </div>
                                )}
                                {a.is_online_quiz && a.assessment_type === 'assignment' && (
                                  <div className="pt-4 border-t border-border/50">
                                    <h4 className="font-semibold text-sm mb-2">Student Submissions</h4>
                                    <p className="text-xs text-muted-foreground mb-3">Review student answers and assign marks manually.</p>
                                    {renderMarksTable(a)}
                                  </div>
                                )}
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

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="space-y-4 mt-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">Attendance for {courseName}</h2>
              </div>

              <Card className="animate-card backdrop-blur border border-border/50 bg-card/80">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Date & Time
                      </Label>
                      <Input
                        type="datetime-local"
                        value={attendanceDate}
                        onChange={e => setAttendanceDate(e.target.value)}
                        className="rounded-xl w-[260px]"
                      />
                    </div>
                    <Button onClick={handleSaveAttendance} disabled={attendanceSaving || attendanceRecords.length === 0} className="gap-2 rounded-xl mt-5">
                      <Upload className="w-4 h-4" />
                      {attendanceSaving ? 'Saving...' : 'Upload Attendance'}
                    </Button>
                  </div>

                  {/* Screenshot AI Upload */}
                  {attendanceRecords.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        <Label className="text-sm font-medium">Auto-detect from Screenshot</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload a screenshot from Zoom, Google Meet, or Teams showing participants. AI will match names against enrolled students and mark attendance automatically.
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={e => setScreenshotFile(e.target.files?.[0] || null)}
                          className="rounded-xl flex-1 max-w-xs"
                        />
                        <Button
                          onClick={handleScreenshotUpload}
                          disabled={!screenshotFile || screenshotParsing}
                          variant="secondary"
                          className="gap-2 rounded-xl"
                        >
                          {screenshotParsing ? (
                            <>
                              <span className="animate-spin">⏳</span> Analyzing...
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" /> Scan Screenshot
                            </>
                          )}
                        </Button>
                      </div>
                      {screenshotFile && !screenshotParsing && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> {screenshotFile.name}
                        </p>
                      )}
                    </div>
                  )}

                  {attendanceLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading students...</div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No students enrolled in {selectedCourse}. Enroll students first using "Manage Students".</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="w-[200px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRecords.map((r, i) => (
                            <TableRow key={r.student_id}>
                              <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                              <TableCell className="text-sm font-medium">{r.student_name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{r.student_email}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {['present', 'absent', 'late'].map(status => (
                                    <Button
                                      key={status}
                                      variant={r.status === status ? 'default' : 'outline'}
                                      size="sm"
                                      className={`text-xs h-7 rounded-lg capitalize ${
                                        r.status === status
                                          ? status === 'present'
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : status === 'absent'
                                              ? 'bg-red-600 hover:bg-red-700 text-white'
                                              : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                          : ''
                                      }`}
                                      onClick={() => updateAttendanceStatus(r.student_id, status)}
                                    >
                                      {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'L'}
                                    </Button>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
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
              <input type="checkbox" id="hardcopy" checked={addStudentIsHardCopy} onChange={e => setAddStudentIsHardCopy(e.target.checked)} className="rounded" />
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
