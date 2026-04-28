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
/// links) plus paragraph, bullet-list, and GitHub-flavored table support.
/// Foundation's `AttributedString(markdown:)` only handles inline syntax
/// inside a single paragraph, so we split on blank lines, bullet markers,
/// and table fences ourselves and render each block as its own view.
private struct MarkdownText: View {
    let raw: String

    init(_ raw: String) { self.raw = raw }

    private enum Block {
        case text(String)              // paragraph or list item (inline-rendered)
        case table(header: [String], rows: [[String]])
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
                switch block {
                case .text(let body):
                    // Note: the base font here MUST NOT pin a weight (no
                    // weight: .regular). When the font modifier specifies a
                    // weight, SwiftUI clobbers the bold runs that AttributedString
                    // emits for markdown's `**...**`, leaving raw asterisks
                    // visible. Letting weight stay unset preserves them.
                    Text(parseInline(body))
                        .font(.system(size: 15))
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                case .table(let header, let rows):
                    MarkdownTable(header: header, rows: rows, parseInline: parseInline)
                }
            }
        }
    }

    /// Split the raw markdown into renderable blocks.
    /// - blank-line-separated paragraphs collapse onto one line,
    /// - list-item lines starting with "- " or "* " stand on their own,
    /// - consecutive lines that start with "|" become a table (the
    ///   `|---|---|` separator row is detected and used as the boundary
    ///   between header and body rows).
    private var blocks: [Block] {
        var result: [Block] = []
        var paragraphBuf: [String] = []
        var tableBuf: [String] = []

        func flushParagraph() {
            if !paragraphBuf.isEmpty {
                result.append(.text(paragraphBuf.joined(separator: " ")))
                paragraphBuf.removeAll()
            }
        }

        func flushTable() {
            guard !tableBuf.isEmpty else { return }
            if let parsed = parseTable(tableBuf) {
                result.append(.table(header: parsed.header, rows: parsed.rows))
            } else {
                // Couldn't parse as a table — fall back to plain text so we
                // never lose content.
                for line in tableBuf {
                    result.append(.text(line))
                }
            }
            tableBuf.removeAll()
        }

        for line in raw.components(separatedBy: "\n") {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            let isTableLine = trimmed.hasPrefix("|") && trimmed.hasSuffix("|") && trimmed.count > 1

            if isTableLine {
                flushParagraph()
                tableBuf.append(trimmed)
                continue
            } else if !tableBuf.isEmpty {
                flushTable()
            }

            if trimmed.isEmpty {
                flushParagraph()
            } else if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") {
                flushParagraph()
                result.append(.text(trimmed))
            } else {
                paragraphBuf.append(trimmed)
            }
        }
        flushParagraph()
        flushTable()
        return result
    }

    /// Parse a list of `|cell|cell|` lines into header + rows.
    /// Returns nil if the structure isn't a valid table.
    private func parseTable(_ lines: [String]) -> (header: [String], rows: [[String]])? {
        guard lines.count >= 2 else { return nil }

        func splitRow(_ line: String) -> [String] {
            var s = line
            if s.hasPrefix("|") { s.removeFirst() }
            if s.hasSuffix("|") { s.removeLast() }
            return s.components(separatedBy: "|").map {
                $0.trimmingCharacters(in: .whitespaces)
            }
        }

        // The separator row must be all dashes / colons / pipes / spaces.
        let separatorAllowed = CharacterSet(charactersIn: "-: |")
        var separatorIdx: Int? = nil
        for (i, line) in lines.enumerated() {
            if line.unicodeScalars.allSatisfy({ separatorAllowed.contains($0) }) &&
               line.contains("-") {
                separatorIdx = i
                break
            }
        }
        guard let sep = separatorIdx, sep > 0 else { return nil }

        let header = splitRow(lines[sep - 1])
        let rows = lines.suffix(from: sep + 1).map { splitRow($0) }
        // Pad or trim each row to match header column count.
        let cols = header.count
        let normalized = rows.map { row -> [String] in
            if row.count == cols { return row }
            if row.count > cols { return Array(row.prefix(cols)) }
            return row + Array(repeating: "", count: cols - row.count)
        }
        return (header, normalized)
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

/// Lightweight table renderer for markdown chat output. Uses a horizontal
/// ScrollView so wide tables stay readable on narrow phones, and a Grid so
/// columns line up across header + body rows.
private struct MarkdownTable: View {
    let header: [String]
    let rows: [[String]]
    let parseInline: (String) -> AttributedString

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                // Header row
                HStack(alignment: .top, spacing: 0) {
                    ForEach(Array(header.enumerated()), id: \.offset) { _, cell in
                        Text(parseInline(cell))
                            .font(.system(size: 13, weight: .semibold))
                            .frame(minWidth: 80, alignment: .leading)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                    }
                }
                .background(Color(.tertiarySystemBackground))

                Divider()

                // Body rows
                ForEach(Array(rows.enumerated()), id: \.offset) { rowIdx, row in
                    HStack(alignment: .top, spacing: 0) {
                        ForEach(Array(row.enumerated()), id: \.offset) { _, cell in
                            Text(parseInline(cell))
                                .font(.system(size: 13))
                                .frame(minWidth: 80, alignment: .leading)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 8)
                        }
                    }
                    if rowIdx < rows.count - 1 {
                        Divider()
                    }
                }
            }
            .background(Color(.systemBackground))
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(Color(.separator), lineWidth: 0.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
    }
}
