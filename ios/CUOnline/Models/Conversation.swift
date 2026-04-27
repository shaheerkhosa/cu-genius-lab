import Foundation

struct Conversation: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let userId: UUID
    let title: String
    let summary: String?
    let messageCount: Int?
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, title, summary
        case userId = "user_id"
        case messageCount = "message_count"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct StoredMessage: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let conversationId: UUID
    let role: String
    let content: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, role, content
        case conversationId = "conversation_id"
        case createdAt = "created_at"
    }
}

struct ChatMessage: Identifiable, Hashable, Sendable {
    let id: UUID
    let role: Role
    var content: String
    var citations: [Citation]

    enum Role: String, Codable, Sendable {
        case user, assistant
    }

    init(id: UUID = UUID(), role: Role, content: String, citations: [Citation] = []) {
        self.id = id
        self.role = role
        self.content = content
        self.citations = citations
    }
}

struct Citation: Codable, Hashable, Sendable {
    let slug: String
    let title: String
    let source: String
}

struct ChatRequest: Codable, Sendable {
    let messages: [ChatRequestMessage]
    let summary: String?
    let generateSummary: Bool?

    enum CodingKeys: String, CodingKey {
        case messages, summary
        case generateSummary = "generateSummary"
    }
}

struct ChatRequestMessage: Codable, Sendable {
    let role: String
    let content: String
}

struct ChatResponse: Codable, Sendable {
    let message: ChatResponseMessage?
    let summary: String?
    let error: String?
}

struct ChatResponseMessage: Codable, Sendable {
    let content: String
    let citations: [Citation]?
}
