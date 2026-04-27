import Foundation

struct QuizQuestion: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let assessmentId: UUID
    let questionText: String
    let optionA: String
    let optionB: String
    let optionC: String
    let optionD: String
    let correctOption: String
    let marks: Double
    let questionOrder: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, marks
        case assessmentId = "assessment_id"
        case questionText = "question_text"
        case optionA = "option_a"
        case optionB = "option_b"
        case optionC = "option_c"
        case optionD = "option_d"
        case correctOption = "correct_option"
        case questionOrder = "question_order"
        case createdAt = "created_at"
    }

    func text(for option: String) -> String {
        switch option.uppercased() {
        case "A": return optionA
        case "B": return optionB
        case "C": return optionC
        case "D": return optionD
        default: return ""
        }
    }
}

struct QuizAttempt: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let assessmentId: UUID
    let studentId: UUID
    let startedAt: Date
    let completedAt: Date?
    let score: Double?
    let totalMarks: Double?

    enum CodingKeys: String, CodingKey {
        case id, score
        case assessmentId = "assessment_id"
        case studentId = "student_id"
        case startedAt = "started_at"
        case completedAt = "completed_at"
        case totalMarks = "total_marks"
    }

    var isCompleted: Bool { completedAt != nil }
}

struct QuizResponse: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let assessmentId: UUID
    let studentId: UUID
    let questionId: UUID
    let selectedOption: String?
    let isCorrect: Bool?
    let submittedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case assessmentId = "assessment_id"
        case studentId = "student_id"
        case questionId = "question_id"
        case selectedOption = "selected_option"
        case isCorrect = "is_correct"
        case submittedAt = "submitted_at"
    }
}

struct NewQuizResponse: Codable, Sendable {
    let assessmentId: UUID
    let studentId: UUID
    let questionId: UUID
    let selectedOption: String?
    let isCorrect: Bool

    enum CodingKeys: String, CodingKey {
        case assessmentId = "assessment_id"
        case studentId = "student_id"
        case questionId = "question_id"
        case selectedOption = "selected_option"
        case isCorrect = "is_correct"
    }
}

struct NewQuizAttempt: Codable, Sendable {
    let assessmentId: UUID
    let studentId: UUID
    let score: Double
    let totalMarks: Double
    let completedAt: Date

    enum CodingKeys: String, CodingKey {
        case assessmentId = "assessment_id"
        case studentId = "student_id"
        case score
        case totalMarks = "total_marks"
        case completedAt = "completed_at"
    }
}
