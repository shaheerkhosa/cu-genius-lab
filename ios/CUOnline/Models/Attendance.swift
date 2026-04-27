import Foundation

struct Attendance: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let studentId: UUID
    let teacherId: UUID
    let courseCode: String
    let date: String
    let status: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, date, status
        case studentId = "student_id"
        case teacherId = "teacher_id"
        case courseCode = "course_code"
        case createdAt = "created_at"
    }

    enum Mark: String {
        case present, absent, late
    }

    var mark: Mark? { Mark(rawValue: status.lowercased()) }
}

struct AttendanceSummary: Hashable, Sendable {
    let courseCode: String
    let total: Int
    let present: Int
    let absent: Int
    let late: Int

    var percentage: Double {
        guard total > 0 else { return 0 }
        return Double(present) / Double(total) * 100
    }
}
