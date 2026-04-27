import Foundation

struct TimetableEntry: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let courseCode: String
    let courseName: String
    let dayOfWeek: Int
    let startTime: String
    let endTime: String
    let room: String?
    let teacherId: UUID?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, room
        case courseCode = "course_code"
        case courseName = "course_name"
        case dayOfWeek = "day_of_week"
        case startTime = "start_time"
        case endTime = "end_time"
        case teacherId = "teacher_id"
        case createdAt = "created_at"
    }

    var dayName: String {
        let names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        guard names.indices.contains(dayOfWeek) else { return "" }
        return names[dayOfWeek]
    }

    var shortDayName: String { String(dayName.prefix(3)) }

    var timeRange: String { "\(startTime.prefix(5)) - \(endTime.prefix(5))" }
}
