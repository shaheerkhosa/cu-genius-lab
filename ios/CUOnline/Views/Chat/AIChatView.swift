import SwiftUI

struct AIChatView: View {
    @State private var vm = ChatViewModel()

    var body: some View {
        VStack(spacing: 0) {
            if vm.messages.isEmpty {
                emptyState
            } else {
                messageList
            }
            if let error = vm.errorMessage {
                ErrorBanner(message: error).padding(.horizontal, 16).padding(.bottom, 6)
            }
            inputBar
        }
        .background(Color(.systemBackground))
        .navigationTitle("AI Assistant")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var emptyState: some View {
        ScrollView {
            VStack(spacing: 12) {
                promptCard(icon: "text.bubble", title: "Explain", subtitle: "What is the attendance requirement to sit a final?")
                promptCard(icon: "pencil.and.outline", title: "Write", subtitle: "Draft a leave application to my department head.")
                promptCard(icon: "globe", title: "Translate", subtitle: "How do I say 'good morning' in Urdu?")
            }
            .padding(.horizontal, 20)
            .padding(.top, 24)
        }
    }

    private func promptCard(icon: String, title: String, subtitle: String) -> some View {
        Button {
            vm.draft = subtitle
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: icon)
                    Text(title).font(.system(size: 14, weight: .semibold))
                }
                .foregroundStyle(Color.brandBlue)
                Text(subtitle)
                    .font(.cuBody)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 10) {
                    ForEach(vm.messages) { message in
                        bubble(for: message).id(message.id)
                    }
                    if vm.isSending {
                        HStack { ProgressView(); Text("Thinking…").font(.cuCaption).foregroundStyle(.secondary) }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 20)
                    }
                }
                .padding(.vertical, 12)
            }
            .onChange(of: vm.messages.count) { _, _ in
                if let last = vm.messages.last {
                    withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                }
            }
        }
    }

    private func bubble(for message: ChatMessage) -> some View {
        let isUser = message.role == .user
        return HStack {
            if isUser { Spacer(minLength: 40) }
            VStack(alignment: .leading, spacing: 6) {
                bubbleContent(for: message, isUser: isUser)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(isUser ? Color.brandBlue : Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                if !message.citations.isEmpty {
                    citationsView(message.citations)
                }
            }
            if !isUser { Spacer(minLength: 40) }
        }
        .padding(.horizontal, 16)
    }

    @ViewBuilder
    private func bubbleContent(for message: ChatMessage, isUser: Bool) -> some View {
        if isUser {
            Text(message.content)
                .font(.cuBody)
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            MarkdownText(message.content)
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func citationsView(_ citations: [Citation]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Sources").font(.system(size: 11, weight: .semibold)).foregroundStyle(.secondary)
            ForEach(Array(citations.enumerated()), id: \.offset) { _, c in
                HStack(spacing: 4) {
                    Image(systemName: "doc.text")
                    Text(c.title).font(.system(size: 11)).foregroundStyle(Color.brandBlue)
                }
            }
        }
    }

    private var inputBar: some View {
        HStack(spacing: 8) {
            TextField("Write your message", text: $vm.draft, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            Button {
                Task { await vm.send() }
            } label: {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .padding(12)
                    .background(vm.canSend ? Color.brandBlue : Color.gray.opacity(0.3))
                    .foregroundStyle(.white)
                    .clipShape(Circle())
            }
            .disabled(!vm.canSend)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.bar)
    }
}

/// Renders a markdown string with inline formatting (bold, italic, code,
/// links) plus paragraph and bullet-list line breaks. Foundation's
/// `AttributedString(markdown:)` only handles inline syntax inside a single
/// paragraph, so we split on blank lines and bullet markers ourselves and
/// render each block as its own Text view.
private struct MarkdownText: View {
    let raw: String

    init(_ raw: String) { self.raw = raw }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
                // Note: the base font here MUST NOT pin a weight (no
                // weight: .regular). When the font modifier specifies a
                // weight, SwiftUI clobbers the bold runs that AttributedString
                // emits for markdown's `**...**`, leaving raw asterisks
                // visible. Letting weight stay unset preserves them.
                Text(parseInline(block))
                    .font(.system(size: 15))
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// Render units: blank-line-separated paragraphs collapse onto one line,
    /// list-item lines starting with "- " or "* " stand on their own.
    private var blocks: [String] {
        var result: [String] = []
        var buffer: [String] = []

        func flush() {
            if !buffer.isEmpty {
                result.append(buffer.joined(separator: " "))
                buffer.removeAll()
            }
        }

        for line in raw.components(separatedBy: "\n") {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.isEmpty {
                flush()
            } else if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") {
                flush()
                result.append(trimmed)
            } else {
                buffer.append(trimmed)
            }
        }
        flush()
        return result
    }

    private func parseInline(_ text: String) -> AttributedString {
        let options = AttributedString.MarkdownParsingOptions(
            interpretedSyntax: .inlineOnlyPreservingWhitespace
        )
        if let attr = try? AttributedString(markdown: text, options: options) {
            return attr
        }
        return AttributedString(text)
    }
}
