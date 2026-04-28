// Shared academic types used by performanceAnalyzer + academicPredictor.
// Real data is assembled into these shapes by the page-level fetchers.

export interface Course {
  code: string;
  name: string;
  credits: number;
  grade: string;
  points: number;
}

export interface Semester {
  number: number;
  name: string;
  status: "completed" | "current" | "future";
  courses: Course[];
  semesterGPA: number;
  creditsAttempted: number;
  creditsEarned: number;
  achievements?: string[];
  warnings?: string[];
}

export interface FailedCourse {
  code: string;
  name: string;
  credits: number;
  attempts: number;
  status: "pending_retake" | "retaken_passed" | "retaken_failed";
  originalSemester: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  program: string;
  enrollmentDate: string;
  totalCreditsRequired: number;
  currentSemester: number;
  semesters: Semester[];
  failedCourses: FailedCourse[];
}
