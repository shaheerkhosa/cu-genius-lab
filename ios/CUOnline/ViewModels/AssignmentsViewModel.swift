import Foundation
import Observation

@MainActor
@Observable
final class AssignmentsViewModel {
    enum Filter: Hashable, CaseIterable {
        case due, submitted, overdue
        var label: String {
            switch self {
            case .due: return "Due"
            case .submitted: return "Submitted"
            case .overdue: return "Overdue"
            }
        }
    }

    let courseCode: String
    var assessments: [Assessment] = []
    var marks: [StudentMark] = []
    var filter: Filter = .due
    var isLoading = false
    var errorMessage: String?

    private let auth = AuthService()
    private let service = AssessmentService()

    init(courseCode: String) { self.courseCode = courseCode }

    var filtered: [Assessment] {
        assessments.filter { a in
            let mark = marks.first(where: { $0.assessmentId == a.id })
            let status = a.status(submission: mark)
            switch filter {
            case .due: return status == .due
            case .submitted: return status == .submitted || status == .finalized
            case .overdue: return status == .overdue
            }
        }
    }

    func mark(for assessment: Assessment) -> StudentMark? {
        marks.first(where: { $0.assessmentId == assessment.id })
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let userId = try await auth.currentUserId()
            async let assessmentsTask = service.assessments(courseCode: courseCode, onlineQuiz: false)
            async let marksTask = service.studentMarks(studentId: userId, courseCode: courseCode)
            self.assessments = try await assessmentsTask
            self.marks = try await marksTask
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
