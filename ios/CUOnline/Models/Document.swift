import Foundation

struct StudentDocument: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let userId: UUID
    let documentType: String
    let fileName: String
    let filePath: String
    let fileSize: Int?
    let mimeType: String?
    let verificationStatus: String?
    let verificationScore: Double?
    let adminNotes: String?
    let createdAt: Date?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case documentType = "document_type"
        case fileName = "file_name"
        case filePath = "file_path"
        case fileSize = "file_size"
        case mimeType = "mime_type"
        case verificationStatus = "verification_status"
        case verificationScore = "verification_score"
        case adminNotes = "admin_notes"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct AppNotification: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let userId: UUID
    let type: String
    let title: String
    let message: String?
    let documentId: UUID?
    let read: Bool?
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, type, title, message, read
        case userId = "user_id"
        case documentId = "document_id"
        case createdAt = "created_at"
    }
}
