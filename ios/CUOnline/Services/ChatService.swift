import Foundation
import Supabase

enum ChatServiceError: LocalizedError {
    case emptyResponse
    case server(String)

    var errorDescription: String? {
        switch self {
        case .emptyResponse: return "Empty response from AI assistant."
        case .server(let m): return m
        }
    }
}

struct ChatService {
    private var client: SupabaseClient { SupabaseService.client }

    func send(messages: [ChatMessage], summary: String? = nil) async throws -> (reply: ChatMessage, summary: String?) {
        let body = ChatRequest(
            messages: messages.suffix(20).map { ChatRequestMessage(role: $0.role.rawValue, content: $0.content) },
            summary: summary,
            generateSummary: nil
        )

        let response: ChatResponse = try await client.functions.invoke(
            "chat-ollama",
            options: FunctionInvokeOptions(body: body)
        )

        if let error = response.error {
            throw ChatServiceError.server(error)
        }
        guard let message = response.message else {
            throw ChatServiceError.emptyResponse
        }
        let reply = ChatMessage(
            role: .assistant,
            content: message.content,
            citations: message.citations ?? []
        )
        return (reply, response.summary)
    }
}
