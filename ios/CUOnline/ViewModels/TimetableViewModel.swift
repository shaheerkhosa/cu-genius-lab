import Foundation
import Observation

@MainActor
@Observable
final class TimetableViewModel {
    var entries: [TimetableEntry] = []
    var courses: [Course] = []
    var isLoading = false
    var errorMessage: String?

    private let auth = AuthService()
    private let service = TimetableService()
    private let courseService = CourseService()

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let userId = try await auth.currentUserId()
            async let entriesTask = service.entries(forStudent: userId)
            async let coursesTask = courseService.enrolledCourses(for: userId)
            self.entries = try await entriesTask
            self.courses = try await coursesTask
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func entries(forDay day: Int) -> [TimetableEntry] {
        entries.filter { $0.dayOfWeek == day }.sorted { $0.startTime < $1.startTime }
    }

    func tint(forCourseCode code: String) -> CourseTint {
        guard let index = courses.firstIndex(where: { $0.courseCode == code }) else { return .blue }
        return CourseTint.tint(for: index)
    }
}
