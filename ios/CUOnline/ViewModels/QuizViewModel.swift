import Foundation
import Observation

@MainActor
@Observable
final class QuizListViewModel {
    let courseCode: String
    var quizzes: [Assessment] = []
    var attemptsByAssessment: [UUID: QuizAttempt] = [:]
    var isLoading = false
    var errorMessage: String?

    private let auth = AuthService()
    private let service = QuizService()

    init(courseCode: String) { self.courseCode = courseCode }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let userId = try await auth.currentUserId()
            self.quizzes = try await service.quizzes(forCourse: courseCode)
            await withTaskGroup(of: (UUID, QuizAttempt?).self) { group in
                for q in quizzes {
                    group.addTask {
                        let attempt = try? await self.service.attempt(studentId: userId, assessmentId: q.id)
                        return (q.id, attempt)
                    }
                }
                for await (id, attempt) in group {
                    if let attempt { self.attemptsByAssessment[id] = attempt }
                }
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func status(for quiz: Assessment) -> String {
        if let a = attemptsByAssessment[quiz.id], a.isCompleted {
            if let total = a.totalMarks, total > 0, let score = a.score {
                return "Completed · \(Int(score))/\(Int(total))"
            }
            return "Completed"
        }
        if let start = quiz.scheduleStart, start > .now { return "Upcoming" }
        if let end = quiz.scheduleEnd, end < .now { return "Closed" }
        return "Open"
    }
}

@MainActor
@Observable
final class TakeQuizViewModel {
    let assessment: Assessment
    var questions: [QuizQuestion] = []
    var answers: [UUID: String] = [:]
    var attempt: QuizAttempt?
    var isLoading = false
    var isSubmitting = false
    var errorMessage: String?
    var submittedScore: (score: Double, total: Double)?

    private let auth = AuthService()
    private let service = QuizService()

    init(assessment: Assessment) { self.assessment = assessment }

    func start() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let userId = try await auth.currentUserId()
            let existing = try await service.attempt(studentId: userId, assessmentId: assessment.id)
            if let existing, existing.isCompleted {
                self.attempt = existing
                if let s = existing.score, let t = existing.totalMarks {
                    self.submittedScore = (s, t)
                }
                return
            }
            if let existing {
                self.attempt = existing
            } else {
                self.attempt = try await service.startAttempt(studentId: userId, assessmentId: assessment.id)
            }
            self.questions = try await service.questions(for: assessment.id)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func submit() async {
        guard let attempt else { return }
        isSubmitting = true
        defer { isSubmitting = false }
        do {
            let userId = try await auth.currentUserId()
            let pairs = questions.map { ($0, answers[$0.id]) }
            let result = try await service.submit(
                attemptId: attempt.id,
                studentId: userId,
                assessmentId: assessment.id,
                answers: pairs
            )
            if let s = result.score, let t = result.totalMarks {
                self.submittedScore = (s, t)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
