import Foundation
import Observation

@MainActor
@Observable
final class CourseDetailViewModel {
    let course: Course
    let tint: CourseTint

    var attendance: AttendanceSummary?
    var assessments: [Assessment] = []
    var marks: [StudentMark] = []
    var isLoading = false
    var errorMessage: String?

    private let auth = AuthService()
    private let attendanceService = AttendanceService()
    private let assessmentService = AssessmentService()

    init(course: Course, tint: CourseTint) {
        self.course = course
        self.tint = tint
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let userId = try await auth.currentUserId()
            async let attendanceTask = attendanceService.summary(studentId: userId, courseCode: course.courseCode)
            async let assessmentsTask = assessmentService.assessments(courseCode: course.courseCode)
            async let marksTask = assessmentService.studentMarks(studentId: userId, courseCode: course.courseCode)

            self.attendance = try await attendanceTask
            self.assessments = try await assessmentsTask
            self.marks = try await marksTask
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
