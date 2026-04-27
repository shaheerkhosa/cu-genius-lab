import Foundation

struct Assessment: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let title: String
    let courseCode: String
    let courseName: String
    let teacherId: UUID
    let assessmentType: String
    let totalMarks: Double
    let isOnlineQuiz: Bool
    let isMarksFinalized: Bool
    let scheduleStart: Date?
    let scheduleEnd: Date?
    let filePath: String?
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, title
        case courseCode = "course_code"
        case courseName = "course_name"
        case teacherId = "teacher_id"
        case assessmentType = "assessment_type"
        case totalMarks = "total_marks"
        case isOnlineQuiz = "is_online_quiz"
        case isMarksFinalized = "is_marks_finalized"
        case scheduleStart = "schedule_start"
        case scheduleEnd = "schedule_end"
        case filePath = "file_path"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct StudentMark: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let assessmentId: UUID
    let studentId: UUID?
    let studentName: String
    let studentRollNumber: String
    let marksObtained: Double?
    let submissionFilePath: String?
    let remarks: String?
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case assessmentId = "assessment_id"
        case studentId = "student_id"
        case studentName = "student_name"
        case studentRollNumber = "student_roll_number"
        case marksObtained = "marks_obtained"
        case submissionFilePath = "submission_file_path"
        case remarks
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

extension Assessment {
    enum Status {
        case due, submitted, overdue, finalized

        var label: String {
            switch self {
            case .due: return "Due"
            case .submitted: return "Submitted"
            case .overdue: return "Overdue"
            case .finalized: return "Graded"
            }
        }
    }

    func status(submission: StudentMark?, now: Date = .now) -> Status {
        if let mark = submission {
            if mark.marksObtained != nil { return .finalized }
            return .submitted
        }
        if let end = scheduleEnd, end < now { return .overdue }
        return .due
    }
}
