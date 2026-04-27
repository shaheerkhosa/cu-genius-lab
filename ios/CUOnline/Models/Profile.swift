import Foundation

struct Profile: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let email: String
    let username: String
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, email, username
        case createdAt = "created_at"
    }
}

struct UserRole: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let userId: UUID
    let role: String
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, role
        case userId = "user_id"
        case createdAt = "created_at"
    }
}
