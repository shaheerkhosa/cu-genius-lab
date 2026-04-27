import Foundation
import Observation

@MainActor
@Observable
final class ChatViewModel {
    var messages: [ChatMessage] = []
    var draft: String = ""
    var isSending = false
    var errorMessage: String?
    var summary: String?

    private let chat = ChatService()

    var canSend: Bool {
        !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSending
    }

    func send() async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        draft = ""
        let userMsg = ChatMessage(role: .user, content: text)
        messages.append(userMsg)
        isSending = true
        errorMessage = nil
        defer { isSending = false }
        do {
            let result = try await chat.send(messages: messages, summary: summary)
            messages.append(result.reply)
            if let s = result.summary { self.summary = s }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func reset() {
        messages.removeAll()
        summary = nil
        errorMessage = nil
    }
}
