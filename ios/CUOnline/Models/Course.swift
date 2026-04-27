import Foundation

struct Course: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let courseCode: String
    let courseName: String
    let credits: Int
    let department: String
    let semesterNumber: Int
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, credits, department
        case courseCode = "course_code"
        case courseName = "course_name"
        case semesterNumber = "semester_number"
        case createdAt = "created_at"
    }
}

struct CourseEnrollment: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let studentId: UUID
    let courseCode: String
    let enrolledAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case studentId = "student_id"
        case courseCode = "course_code"
        case enrolledAt = "enrolled_at"
    }
}
