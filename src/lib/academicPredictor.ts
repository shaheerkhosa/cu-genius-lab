import { StudentProfile, Semester } from "@/data/sampleStudentData";

export interface GPATrend {
  trend: "improving" | "declining" | "stable";
  change: number;
  description: string;
}

export interface GPAPrediction {
  currentCGPA: number;
  predictedFinalGPA: number;
  range: [number, number];
  trend: GPATrend;
  semesterData: {
    semester: string;
    gpa: number;
    cgpa: number;
  }[];
}

export interface Milestone {
  id: string;
  semesterNumber: number;
  date: string;
  status: "completed" | "current" | "future" | "start" | "graduation";
  title: string;
  description: string;
  gpa?: number;
  credits?: number;
  icon: "check" | "warning" | "trophy" | "clock" | "flag" | "graduation";
  highlights?: string[];
}

export interface GraduationPrediction {
  expectedDate: string;
  semestersRemaining: number;
  confidence: number;
  riskFactors: string[];
  milestones: Milestone[];
  creditsEarned: number;
  creditsRemaining: number;
}

// Calculate cumulative GPA from all semesters
export function calculateCGPA(semesters: Semester[]): number {
  const completedSemesters = semesters.filter(s => s.status !== "future");
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  completedSemesters.forEach(sem => {
    sem.courses.forEach(course => {
      totalPoints += course.points * course.credits;
      totalCredits += course.credits;
    });
  });
  
  return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
}

// Calculate running CGPA at each semester
export function calculateRunningCGPA(semesters: Semester[]): number[] {
  const cgpas: number[] = [];
  let totalPoints = 0;
  let totalCredits = 0;
  
  semesters.filter(s => s.status !== "future").forEach(sem => {
    sem.courses.forEach(course => {
      totalPoints += course.points * course.credits;
      totalCredits += course.credits;
    });
    cgpas.push(parseFloat((totalPoints / totalCredits).toFixed(2)));
  });
  
  return cgpas;
}

// Analyze GPA trend
export function analyzeGPATrend(semesters: Semester[]): GPATrend {
  const completedSemesters = semesters.filter(s => s.status === "completed" || s.status === "current");
  
  if (completedSemesters.length < 2) {
    return { trend: "stable", change: 0, description: "Not enough data" };
  }
  
  const recentGPAs = completedSemesters.slice(-3).map(s => s.semesterGPA);
  const avgRecent = recentGPAs.reduce((a, b) => a + b, 0) / recentGPAs.length;
  
  const olderGPAs = completedSemesters.slice(0, -2).map(s => s.semesterGPA);
  const avgOlder = olderGPAs.length > 0 
    ? olderGPAs.reduce((a, b) => a + b, 0) / olderGPAs.length 
    : avgRecent;
  
  const change = parseFloat((avgRecent - avgOlder).toFixed(2));
  
  if (change > 0.15) {
    return { trend: "improving", change, description: "Your GPA is on an upward trajectory" };
  } else if (change < -0.15) {
    return { trend: "declining", change, description: "Your GPA has been declining recently" };
  }
  return { trend: "stable", change, description: "Your GPA has remained consistent" };
}

// Predict final GPA
export function predictFinalGPA(student: StudentProfile): GPAPrediction {
  const completedSemesters = student.semesters.filter(s => s.status !== "future");
  const currentCGPA = calculateCGPA(completedSemesters);
  const runningCGPAs = calculateRunningCGPA(completedSemesters);
  const trend = analyzeGPATrend(completedSemesters);
  
  // Simple prediction: current + trend adjustment
  const semestersRemaining = Math.ceil((student.totalCreditsRequired - getTotalCreditsEarned(student)) / 15);
  const trendAdjustment = trend.change * 0.3 * semestersRemaining;
  const predictedFinalGPA = Math.min(4.0, Math.max(0, currentCGPA + trendAdjustment));
  
  // Calculate range
  const range: [number, number] = [
    Math.max(0, parseFloat((predictedFinalGPA - 0.15).toFixed(2))),
    Math.min(4.0, parseFloat((predictedFinalGPA + 0.15).toFixed(2)))
  ];
  
  // Build semester data for chart
  const semesterData = completedSemesters.map((sem, index) => ({
    semester: sem.name,
    gpa: sem.semesterGPA,
    cgpa: runningCGPAs[index],
  }));
  
  return {
    currentCGPA,
    predictedFinalGPA: parseFloat(predictedFinalGPA.toFixed(2)),
    range,
    trend,
    semesterData,
  };
}

// Get total credits earned
export function getTotalCreditsEarned(student: StudentProfile): number {
  return student.semesters
    .filter(s => s.status !== "future")
    .reduce((sum, sem) => sum + sem.creditsEarned, 0);
}

// Estimate graduation
export function estimateGraduation(student: StudentProfile): GraduationPrediction {
  const creditsEarned = getTotalCreditsEarned(student);
  const creditsRemaining = student.totalCreditsRequired - creditsEarned;
  const avgCreditsPerSem = creditsEarned / student.semesters.filter(s => s.status !== "future").length;
  
  // Calculate risk factors
  const riskFactors: string[] = [];
  const failedCoursesPending = student.failedCourses.filter(f => f.status === "pending_retake");
  
  if (failedCoursesPending.length > 0) {
    riskFactors.push(`${failedCoursesPending.length} course(s) pending retake`);
  }
  
  if (avgCreditsPerSem < 14) {
    riskFactors.push("Below average credit load per semester");
  }
  
  const failureRate = student.failedCourses.length / student.semesters.filter(s => s.status !== "future").length;
  if (failureRate > 0.15) {
    riskFactors.push("Higher than average course failure rate");
  }
  
  // Calculate semesters remaining with adjustments
  let baseSemestersRemaining = Math.ceil(creditsRemaining / avgCreditsPerSem);
  const retakeAdjustment = failedCoursesPending.length * 0.5;
  const adjustedSemestersRemaining = Math.ceil(baseSemestersRemaining + retakeAdjustment);
  
  // Calculate confidence
  const confidence = Math.max(50, Math.min(95, 85 - (riskFactors.length * 10) - (failureRate * 20)));
  
  // Calculate expected graduation date
  const currentDate = new Date();
  const monthsToAdd = adjustedSemestersRemaining * 6;
  const graduationDate = new Date(currentDate);
  graduationDate.setMonth(graduationDate.getMonth() + monthsToAdd);
  
  // Adjust to graduation month (May or December)
  const gradMonth = graduationDate.getMonth();
  if (gradMonth >= 1 && gradMonth <= 6) {
    graduationDate.setMonth(4); // May
  } else {
    graduationDate.setMonth(11); // December
  }
  
  const expectedDate = graduationDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  
  // Generate milestones
  const milestones = generateMilestones(student, adjustedSemestersRemaining, expectedDate);
  
  return {
    expectedDate,
    semestersRemaining: adjustedSemestersRemaining,
    confidence: Math.round(confidence),
    riskFactors,
    milestones,
    creditsEarned,
    creditsRemaining,
  };
}

// Generate timeline milestones
function generateMilestones(student: StudentProfile, semestersRemaining: number, expectedDate: string): Milestone[] {
  const milestones: Milestone[] = [];
  
  // Start milestone
  milestones.push({
    id: "start",
    semesterNumber: 0,
    date: student.enrollmentDate,
    status: "start",
    title: "Journey Begins",
    description: `Started ${student.program}`,
    icon: "flag",
  });
  
  // Past semesters
  student.semesters.filter(s => s.status === "completed").forEach(sem => {
    const milestone: Milestone = {
      id: `sem-${sem.number}`,
      semesterNumber: sem.number,
      date: sem.name,
      status: "completed",
      title: `Semester ${sem.number}`,
      description: `Completed with ${sem.creditsEarned} credits`,
      gpa: sem.semesterGPA,
      credits: sem.creditsEarned,
      icon: sem.achievements?.includes("Dean's List") ? "trophy" : sem.warnings?.length ? "warning" : "check",
      highlights: [...(sem.achievements || []), ...(sem.warnings || [])],
    };
    milestones.push(milestone);
  });
  
  // Current semester
  const currentSem = student.semesters.find(s => s.status === "current");
  if (currentSem) {
    milestones.push({
      id: `sem-${currentSem.number}`,
      semesterNumber: currentSem.number,
      date: currentSem.name,
      status: "current",
      title: `Semester ${currentSem.number} (Current)`,
      description: `In progress - ${currentSem.creditsAttempted} credits`,
      gpa: currentSem.semesterGPA,
      credits: currentSem.creditsAttempted,
      icon: "clock",
    });
  }
  
  // Future semesters
  const currentSemNum = currentSem?.number || student.currentSemester;
  for (let i = 1; i <= semestersRemaining; i++) {
    const semNum = currentSemNum + i;
    const isFall = (semNum + 1) % 2 === 0;
    const year = 2024 + Math.floor((semNum - 5) / 2) + (isFall ? 1 : 1);
    const semName = `${isFall ? "Fall" : "Spring"} ${year}`;
    
    milestones.push({
      id: `sem-${semNum}`,
      semesterNumber: semNum,
      date: semName,
      status: "future",
      title: `Semester ${semNum}`,
      description: "Upcoming semester",
      icon: "clock",
    });
  }
  
  // Graduation milestone
  milestones.push({
    id: "graduation",
    semesterNumber: currentSemNum + semestersRemaining + 1,
    date: expectedDate,
    status: "graduation",
    title: "Graduation",
    description: `Expected: ${student.program}`,
    icon: "graduation",
  });
  
  return milestones;
}
