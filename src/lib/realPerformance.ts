// Real-data analogues of the helpers in performanceAnalyzer.ts.
// These query Supabase and shape results into SubjectPerformance so
// the existing UI/AI flows in Study.tsx + TeacherStudyGuide.tsx keep working.

import { supabase } from "@/integrations/supabase/client";
import type { SubjectPerformance, CLOScore } from "@/lib/performanceAnalyzer";

const getGrade = (pct: number) => {
  if (pct >= 90) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 80) return "A-";
  if (pct >= 75) return "B+";
  if (pct >= 70) return "B";
  if (pct >= 65) return "B-";
  if (pct >= 60) return "C+";
  if (pct >= 55) return "C";
  if (pct >= 50) return "D";
  return "F";
};

const getPoints = (pct: number) => {
  if (pct >= 90) return 4.0;
  if (pct >= 85) return 4.0;
  if (pct >= 80) return 3.67;
  if (pct >= 75) return 3.33;
  if (pct >= 70) return 3.0;
  if (pct >= 65) return 2.67;
  if (pct >= 60) return 2.33;
  if (pct >= 55) return 2.0;
  if (pct >= 50) return 1.0;
  return 0;
};

interface AssessmentRow {
  id: string;
  course_code: string;
  course_name: string;
  total_marks: number;
  title: string;
  assessment_type: string;
}

/** Build a SubjectPerformance[] for the signed-in student from real DB data. */
export async function fetchStudentSubjectPerformance(
  studentId: string,
): Promise<SubjectPerformance[]> {
  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select("course_code")
    .eq("student_id", studentId);

  const codes = (enrollments ?? []).map((e) => e.course_code);
  if (codes.length === 0) return [];

  const { data: tc } = await supabase
    .from("teacher_courses")
    .select("course_code, course_name")
    .in("course_code", codes);
  const nameMap = new Map((tc ?? []).map((c) => [c.course_code, c.course_name]));

  const { data: marks } = await supabase
    .from("student_marks")
    .select(
      "marks_obtained, assessments!student_marks_assessment_id_fkey(course_code, total_marks, title, assessment_type)",
    )
    .eq("student_id", studentId)
    .not("marks_obtained", "is", null);

  const byCourse = new Map<
    string,
    { obtained: number; possible: number; cloScores: CLOScore[] }
  >();

  for (const row of marks ?? []) {
    const a = (row as { assessments: AssessmentRow | null }).assessments;
    if (!a) continue;
    const obt = row.marks_obtained as number;
    const existing = byCourse.get(a.course_code) ?? {
      obtained: 0,
      possible: 0,
      cloScores: [],
    };
    existing.obtained += obt;
    existing.possible += a.total_marks;
    const pct = a.total_marks > 0 ? (obt / a.total_marks) * 100 : 0;
    existing.cloScores.push({
      cloNumber: existing.cloScores.length + 1,
      description: a.title,
      score: Math.round(pct),
      assessmentType: a.assessment_type,
    });
    byCourse.set(a.course_code, existing);
  }

  const result: SubjectPerformance[] = codes.map((code) => {
    const courseName = nameMap.get(code) ?? code;
    const data = byCourse.get(code);
    const overallPerformance =
      data && data.possible > 0
        ? Math.round((data.obtained / data.possible) * 100)
        : 0;
    const cloScores = data?.cloScores ?? [];
    const weakCLOs = cloScores.filter((c) => c.score < 60);

    return {
      code,
      name: courseName,
      overallPerformance,
      grade: getGrade(overallPerformance),
      gradePoints: getPoints(overallPerformance),
      credits: 3, // DB doesn't track per-course credits yet
      semester: "Current",
      cloScores,
      weakCLOs,
      trend: "stable",
      needsAttention: overallPerformance < 70 || weakCLOs.length > 2,
    };
  });

  return result.sort((a, b) => a.overallPerformance - b.overallPerformance);
}

/** Build a SubjectPerformance[] of class averages for a teacher's courses. */
export async function fetchTeacherClassPerformance(
  teacherId: string,
): Promise<SubjectPerformance[]> {
  const { data: courses } = await supabase
    .from("teacher_courses")
    .select("course_code, course_name")
    .eq("teacher_id", teacherId);

  if (!courses || courses.length === 0) return [];

  const codes = courses.map((c) => c.course_code);
  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, course_code, total_marks, title, assessment_type")
    .in("course_code", codes);

  const assessmentList = (assessments ?? []) as AssessmentRow[];
  const assessmentIds = assessmentList.map((a) => a.id);

  const marksMap = new Map<string, { sum: number; count: number }>();
  if (assessmentIds.length > 0) {
    const { data: marks } = await supabase
      .from("student_marks")
      .select("assessment_id, marks_obtained")
      .in("assessment_id", assessmentIds)
      .not("marks_obtained", "is", null);

    for (const m of marks ?? []) {
      const existing = marksMap.get(m.assessment_id) ?? { sum: 0, count: 0 };
      existing.sum += m.marks_obtained as number;
      existing.count++;
      marksMap.set(m.assessment_id, existing);
    }
  }

  return courses.map((c) => {
    const courseAssessments = assessmentList.filter(
      (a) => a.course_code === c.course_code,
    );
    const cloScores: CLOScore[] = courseAssessments.map((a, i) => {
      const data = marksMap.get(a.id);
      const avgPct =
        data && data.count > 0 && a.total_marks > 0
          ? (data.sum / data.count / a.total_marks) * 100
          : 0;
      return {
        cloNumber: i + 1,
        description: a.title,
        score: Math.round(avgPct),
        assessmentType: a.assessment_type,
      };
    });

    const overallPerformance =
      cloScores.length > 0
        ? Math.round(
            cloScores.reduce((s, c) => s + c.score, 0) / cloScores.length,
          )
        : 0;
    const weakCLOs = cloScores.filter((c) => c.score < 60);

    return {
      code: c.course_code,
      name: c.course_name,
      overallPerformance,
      grade: getGrade(overallPerformance),
      gradePoints: getPoints(overallPerformance),
      credits: 3,
      semester: "Current",
      cloScores,
      weakCLOs,
      trend: "stable",
      needsAttention: overallPerformance < 70 || weakCLOs.length > 2,
    };
  });
}
