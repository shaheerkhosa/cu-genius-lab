import Foundation
import Observation

@MainActor
@Observable
final class DashboardViewModel {
    var courses: [Course] = []
    var attendanceByCourse: [String: AttendanceSummary] = [:]
    var isLoading = false
    var errorMessage: String?

    private let auth = AuthService()
    private let courseService = CourseService()
    private let attendanceService = AttendanceService()

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let userId = try await auth.currentUserId()
            let enrolled = try await courseService.enrolledCourses(for: userId)
            self.courses = enrolled

            await withTaskGroup(of: (String, AttendanceSummary?).self) { group in
                for course in enrolled {
                    group.addTask {
                        let summary = try? await self.attendanceService.summary(
                            studentId: userId,
                            courseCode: course.courseCode
                        )
                        return (course.courseCode, summary)
                    }
                }
                for await (code, summary) in group {
                    if let summary { self.attendanceByCourse[code] = summary }
                }
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func tint(for course: Course) -> CourseTint {
        guard let index = courses.firstIndex(of: course) else { return .blue }
        return CourseTint.tint(for: index)
    }
}
