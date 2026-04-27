import Foundation
import Observation

@MainActor
@Observable
final class MarksViewModel {
    let courseCode: String
    var assessments: [Assessment] = []
    var marks: [StudentMark] = []
    var isLoading = false
    var errorMessage: String?

    private let auth = AuthService()
    private let service = AssessmentService()

    init(courseCode: String) { self.courseCode = courseCode }

    struct Group: Identifiable {
        var id: String { type }
        let type: String
        let items: [Item]

        struct Item: Identifiable, Hashable {
            let id: UUID
            let title: String
            let totalMarks: Double
            let obtained: Double?
            let date: Date?
        }
    }

    var groups: [Group] {
        let buckets = Dictionary(grouping: assessments) { $0.assessmentType }
        return buckets
            .map { (type, list) in
                let items = list.map { a in
                    let mark = marks.first(where: { $0.assessmentId == a.id })
                    return Group.Item(
                        id: a.id,
                        title: a.title,
                        totalMarks: a.totalMarks,
                        obtained: mark?.marksObtained,
                        date: a.scheduleEnd ?? a.scheduleStart
                    )
                }
                return Group(type: type, items: items)
            }
            .sorted { $0.type.localizedCaseInsensitiveCompare($1.type) == .orderedAscending }
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let userId = try await auth.currentUserId()
            async let assessmentsTask = service.assessments(courseCode: courseCode)
            async let marksTask = service.studentMarks(studentId: userId, courseCode: courseCode)
            self.assessments = try await assessmentsTask
            self.marks = try await marksTask
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
