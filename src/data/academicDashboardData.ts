export interface Quiz {
  id: string;
  courseCode: string;
  courseName: string;
  date: string;
  time: string;
  topics: string[];
  status: "upcoming" | "completed" | "missed";
}

export interface Assignment {
  id: string;
  courseCode: string;
  courseName: string;
  title: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  score?: number;
  totalMarks?: number;
}

export interface AttendanceRecord {
  courseCode: string;
  courseName: string;
  attended: number;
  total: number;
  percentage: number;
  status: "good" | "warning" | "critical";
}

export interface MarkRecord {
  courseCode: string;
  courseName: string;
  currentMarks: number;
  totalMarks: number;
  percentage: number;
  grade: string;
}

export interface AcademicAlert {
  id: string;
  type: "attendance" | "marks" | "deadline";
  severity: "info" | "warning" | "critical";
  courseCode: string;
  courseName: string;
  message: string;
  actionRequired: string;
}

export interface PerformanceTrend {
  week: string;
  currentSemester: number;
  lastSemester: number;
}

export const upcomingQuizzes: Quiz[] = [
  {
    id: "q1",
    courseCode: "CS401",
    courseName: "Software Engineering",
    date: "2024-12-02",
    time: "10:00 AM",
    topics: ["Design Patterns", "SOLID Principles"],
    status: "upcoming"
  },
  {
    id: "q2",
    courseCode: "CS403",
    courseName: "Computer Networks",
    date: "2024-12-05",
    time: "2:00 PM",
    topics: ["TCP/IP", "Routing Protocols"],
    status: "upcoming"
  },
  {
    id: "q3",
    courseCode: "CS404",
    courseName: "Artificial Intelligence",
    date: "2024-12-08",
    time: "11:00 AM",
    topics: ["Neural Networks", "Deep Learning"],
    status: "upcoming"
  }
];

export const upcomingAssignments: Assignment[] = [
  {
    id: "a1",
    courseCode: "CS402",
    courseName: "Operating Systems",
    title: "Process Scheduling Simulation",
    dueDate: "2024-12-03",
    status: "pending"
  },
  {
    id: "a2",
    courseCode: "CS404",
    courseName: "Artificial Intelligence",
    title: "Machine Learning Project",
    dueDate: "2024-12-10",
    status: "pending"
  }
];

export const attendanceRecords: AttendanceRecord[] = [
  {
    courseCode: "CS401",
    courseName: "Software Engineering",
    attended: 28,
    total: 30,
    percentage: 93,
    status: "good"
  },
  {
    courseCode: "CS402",
    courseName: "Operating Systems",
    attended: 26,
    total: 30,
    percentage: 87,
    status: "good"
  },
  {
    courseCode: "CS403",
    courseName: "Computer Networks",
    attended: 22,
    total: 30,
    percentage: 73,
    status: "warning"
  },
  {
    courseCode: "CS404",
    courseName: "Artificial Intelligence",
    attended: 27,
    total: 30,
    percentage: 90,
    status: "good"
  },
  {
    courseCode: "MGT301",
    courseName: "Entrepreneurship",
    attended: 25,
    total: 30,
    percentage: 83,
    status: "good"
  }
];

export const markRecords: MarkRecord[] = [
  {
    courseCode: "CS401",
    courseName: "Software Engineering",
    currentMarks: 81,
    totalMarks: 100,
    percentage: 81,
    grade: "A-"
  },
  {
    courseCode: "CS402",
    courseName: "Operating Systems",
    currentMarks: 88,
    totalMarks: 100,
    percentage: 88,
    grade: "A"
  },
  {
    courseCode: "CS403",
    courseName: "Computer Networks",
    currentMarks: 65,
    totalMarks: 100,
    percentage: 65,
    grade: "B"
  },
  {
    courseCode: "CS404",
    courseName: "Artificial Intelligence",
    currentMarks: 92,
    totalMarks: 100,
    percentage: 92,
    grade: "A+"
  },
  {
    courseCode: "MGT301",
    courseName: "Entrepreneurship",
    currentMarks: 78,
    totalMarks: 100,
    percentage: 78,
    grade: "B+"
  }
];

export const academicAlerts: AcademicAlert[] = [
  {
    id: "alert1",
    type: "marks",
    severity: "warning",
    courseCode: "CS403",
    courseName: "Computer Networks",
    message: "Academic Improvement Required",
    actionRequired: "Overall Grades at 65%"
  },
  {
    id: "alert2",
    type: "attendance",
    severity: "warning",
    courseCode: "CS403",
    courseName: "Computer Networks",
    message: "Low Attendance",
    actionRequired: "Attendance at 73%"
  }
];

export const performanceTrend: PerformanceTrend[] = [
  { week: "W1", currentSemester: 75, lastSemester: 78 },
  { week: "W2", currentSemester: 78, lastSemester: 80 },
  { week: "W3", currentSemester: 80, lastSemester: 77 },
  { week: "W4", currentSemester: 82, lastSemester: 79 },
  { week: "W5", currentSemester: 79, lastSemester: 82 },
  { week: "W6", currentSemester: 84, lastSemester: 81 },
  { week: "W7", currentSemester: 85, lastSemester: 83 },
  { week: "W8", currentSemester: 83, lastSemester: 84 }
];
