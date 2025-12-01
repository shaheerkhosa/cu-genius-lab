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

export const sampleStudent: StudentProfile = {
  id: "std-2022-cs-001",
  name: "Ahmed Khan",
  program: "BS Computer Science",
  enrollmentDate: "Fall 2022",
  totalCreditsRequired: 130,
  currentSemester: 5,
  
  semesters: [
    {
      number: 1,
      name: "Fall 2022",
      status: "completed",
      courses: [
        { code: "CS101", name: "Introduction to Programming", credits: 3, grade: "A", points: 4.0 },
        { code: "MATH101", name: "Calculus I", credits: 3, grade: "B+", points: 3.33 },
        { code: "ENG101", name: "English Composition", credits: 3, grade: "A-", points: 3.67 },
        { code: "PHY101", name: "Physics I", credits: 4, grade: "B", points: 3.0 },
        { code: "ISL101", name: "Islamic Studies", credits: 2, grade: "A", points: 4.0 },
      ],
      semesterGPA: 3.47,
      creditsAttempted: 15,
      creditsEarned: 15,
      achievements: ["Strong Start"],
    },
    {
      number: 2,
      name: "Spring 2023",
      status: "completed",
      courses: [
        { code: "CS102", name: "Object Oriented Programming", credits: 3, grade: "A-", points: 3.67 },
        { code: "MATH102", name: "Calculus II", credits: 3, grade: "C+", points: 2.33 },
        { code: "PHY102", name: "Physics II", credits: 4, grade: "F", points: 0.0 },
        { code: "CS103", name: "Digital Logic Design", credits: 3, grade: "B+", points: 3.33 },
      ],
      semesterGPA: 2.31,
      creditsAttempted: 13,
      creditsEarned: 9,
      warnings: ["Failed PHY102"],
    },
    {
      number: 3,
      name: "Fall 2023",
      status: "completed",
      courses: [
        { code: "CS201", name: "Data Structures", credits: 3, grade: "A", points: 4.0 },
        { code: "CS202", name: "Discrete Mathematics", credits: 3, grade: "A-", points: 3.67 },
        { code: "PHY102", name: "Physics II (Retake)", credits: 4, grade: "B", points: 3.0 },
        { code: "MATH201", name: "Linear Algebra", credits: 3, grade: "B+", points: 3.33 },
        { code: "HUM101", name: "Pakistan Studies", credits: 2, grade: "A", points: 4.0 },
      ],
      semesterGPA: 3.52,
      creditsAttempted: 15,
      creditsEarned: 15,
      achievements: ["Dean's List", "Recovered from setback"],
    },
    {
      number: 4,
      name: "Spring 2024",
      status: "completed",
      courses: [
        { code: "CS301", name: "Algorithms", credits: 3, grade: "A-", points: 3.67 },
        { code: "CS302", name: "Database Systems", credits: 3, grade: "A", points: 4.0 },
        { code: "CS303", name: "Computer Architecture", credits: 3, grade: "B+", points: 3.33 },
        { code: "MATH301", name: "Probability & Statistics", credits: 3, grade: "B", points: 3.0 },
        { code: "ENG201", name: "Technical Writing", credits: 3, grade: "A-", points: 3.67 },
      ],
      semesterGPA: 3.53,
      creditsAttempted: 15,
      creditsEarned: 15,
      achievements: ["Dean's List"],
    },
    {
      number: 5,
      name: "Fall 2024",
      status: "current",
      courses: [
        { code: "CS401", name: "Software Engineering", credits: 3, grade: "B+", points: 3.33 },
        { code: "CS402", name: "Operating Systems", credits: 3, grade: "A-", points: 3.67 },
        { code: "CS403", name: "Computer Networks", credits: 3, grade: "B", points: 3.0 },
        { code: "CS404", name: "Artificial Intelligence", credits: 3, grade: "A", points: 4.0 },
        { code: "MGT301", name: "Entrepreneurship", credits: 3, grade: "A-", points: 3.67 },
      ],
      semesterGPA: 3.53,
      creditsAttempted: 15,
      creditsEarned: 15,
    },
  ],
  
  failedCourses: [
    {
      code: "PHY102",
      name: "Physics II",
      credits: 4,
      attempts: 2,
      status: "retaken_passed",
      originalSemester: 2,
    },
  ],
};
