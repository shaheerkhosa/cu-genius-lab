import { StudentProfile, Course } from '@/data/sampleStudentData';

export interface CLOScore {
  cloNumber: number;
  description: string;
  score: number; // 0-100
  assessmentType: string; // quiz, assignment, exam, project
}

export interface SubjectPerformance {
  code: string;
  name: string;
  overallPerformance: number; // 0-100
  grade: string;
  gradePoints: number;
  credits: number;
  semester: string;
  cloScores: CLOScore[];
  weakCLOs: CLOScore[]; // CLOs with score < 60
  trend: 'improving' | 'declining' | 'stable';
  needsAttention: boolean;
}

export interface PerformanceAnalysis {
  overallGPA: number;
  weakSubjects: SubjectPerformance[]; // Performance < 70%
  strongSubjects: SubjectPerformance[];
  criticalCLOs: { subject: string; clo: CLOScore }[];
  recommendations: string[];
}

// Mock CLO data for demonstration
// In real app, this would come from the database
const generateMockCLOScores = (course: Course): CLOScore[] => {
  const basePerformance = (course.points / 4.0) * 100;
  const variation = Math.random() * 20 - 10; // -10 to +10 variation

  const cloDescriptions = [
    'Understand fundamental concepts and theories',
    'Apply knowledge to solve practical problems',
    'Analyze complex scenarios and data',
    'Evaluate solutions and make informed decisions',
    'Create original work and innovative solutions',
  ];

  return cloDescriptions.map((desc, i) => ({
    cloNumber: i + 1,
    description: desc,
    score: Math.max(0, Math.min(100, basePerformance + variation * (Math.random() > 0.5 ? 1 : -1))),
    assessmentType: ['quiz', 'assignment', 'exam', 'project'][Math.floor(Math.random() * 4)],
  }));
};

export function analyzeStudentPerformance(student: StudentProfile): PerformanceAnalysis {
  // Calculate overall GPA
  const totalCredits = student.semesters
    .filter(s => s.status === 'completed' || s.status === 'current')
    .reduce((sum, s) => sum + s.creditsEarned, 0);

  const totalPoints = student.semesters
    .filter(s => s.status === 'completed' || s.status === 'current')
    .reduce((sum, s) => {
      return sum + s.courses.reduce((cSum, c) => cSum + (c.points * c.credits), 0);
    }, 0);

  const overallGPA = totalPoints / totalCredits;

  // Analyze each subject
  const subjectPerformances: SubjectPerformance[] = [];

  student.semesters
    .filter(s => s.status === 'completed' || s.status === 'current')
    .forEach(semester => {
      semester.courses.forEach(course => {
        const cloScores = generateMockCLOScores(course);
        const weakCLOs = cloScores.filter(clo => clo.score < 60);
        const overallPerformance = (course.points / 4.0) * 100;

        subjectPerformances.push({
          code: course.code,
          name: course.name,
          overallPerformance,
          grade: course.grade,
          gradePoints: course.points,
          credits: course.credits,
          semester: semester.name,
          cloScores,
          weakCLOs,
          trend: 'stable', // Would calculate from historical data
          needsAttention: overallPerformance < 70 || weakCLOs.length > 2,
        });
      });
    });

  // Identify weak and strong subjects
  const weakSubjects = subjectPerformances
    .filter(s => s.needsAttention)
    .sort((a, b) => a.overallPerformance - b.overallPerformance);

  const strongSubjects = subjectPerformances
    .filter(s => s.overallPerformance >= 85)
    .sort((a, b) => b.overallPerformance - a.overallPerformance);

  // Critical CLOs across all subjects
  const criticalCLOs: { subject: string; clo: CLOScore }[] = [];
  subjectPerformances.forEach(subject => {
    subject.weakCLOs.forEach(clo => {
      criticalCLOs.push({ subject: subject.name, clo });
    });
  });

  criticalCLOs.sort((a, b) => a.clo.score - b.clo.score);

  // Generate recommendations
  const recommendations: string[] = [];
  if (weakSubjects.length > 0) {
    recommendations.push(`Focus on improving ${weakSubjects[0].name} (${Math.round(weakSubjects[0].overallPerformance)}%)`);
  }
  if (criticalCLOs.length > 0) {
    recommendations.push(`Work on ${criticalCLOs[0].clo.description.toLowerCase()} skills`);
  }
  if (overallGPA < 3.0) {
    recommendations.push('Consider meeting with academic advisor');
  }

  return {
    overallGPA,
    weakSubjects,
    strongSubjects,
    criticalCLOs: criticalCLOs.slice(0, 10), // Top 10 critical CLOs
    recommendations,
  };
}

export function getCurrentSemesterPerformance(student: StudentProfile): SubjectPerformance[] {
  const currentSemester = student.semesters.find(s => s.status === 'current');
  
  if (!currentSemester) return [];

  const performances: SubjectPerformance[] = [];

  currentSemester.courses.forEach(course => {
    const cloScores = generateMockCLOScores(course);
    const weakCLOs = cloScores.filter(clo => clo.score < 60);
    const overallPerformance = (course.points / 4.0) * 100;

    performances.push({
      code: course.code,
      name: course.name,
      overallPerformance,
      grade: course.grade,
      gradePoints: course.points,
      credits: course.credits,
      semester: currentSemester.name,
      cloScores,
      weakCLOs,
      trend: 'stable',
      needsAttention: overallPerformance < 70 || weakCLOs.length > 2,
    });
  });

  return performances.sort((a, b) => a.overallPerformance - b.overallPerformance);
}

export function getSubjectColor(performance: number): string {
  if (performance >= 85) return 'from-green-400 to-emerald-500';
  if (performance >= 70) return 'from-blue-400 to-indigo-500';
  if (performance >= 60) return 'from-yellow-400 to-orange-500';
  return 'from-red-400 to-pink-500';
}

export function getPerformanceBorderColor(performance: number): string {
  if (performance >= 85) return 'border-l-green-400';
  if (performance >= 70) return 'border-l-blue-400';
  if (performance >= 60) return 'border-l-yellow-400';
  return 'border-l-red-400';
}
