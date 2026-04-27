import SwiftUI
import UniformTypeIdentifiers

struct SubmitAssignmentView: View {
    let course: Course
    let tint: CourseTint
    let assessment: Assessment

    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var pickedFile: URL?
    @State private var importing = false
    @State private var submitting = false
    @State private var errorMessage: String?
    @State private var didSubmit = false

    private let assessmentService = AssessmentService()
    private let storage = StorageService()
    private let auth = AuthService()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                hero

                fieldRow("Assignment", value: assessment.title)
                fileRow
                fieldRow("Date", value: Date.now.formatted(date: .abbreviated, time: .omitted))
                fieldRow("Time", value: Date.now.formatted(date: .omitted, time: .shortened))

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    Task { await submit() }
                } label: {
                    Group {
                        if submitting { ProgressView().tint(tint.foreground) }
                        else { Text(didSubmit ? "Submitted" : "Submit") }
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .frame(maxWidth: .infinity).frame(height: 52)
                    .background(didSubmit ? Color.green : tint.color)
                    .foregroundStyle(tint.foreground)
                    .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
                }
                .disabled(submitting || didSubmit)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Submit")
        .navigationBarTitleDisplayMode(.inline)
        .fileImporter(isPresented: $importing, allowedContentTypes: [.pdf, .image, .data]) { result in
            if case .success(let url) = result { pickedFile = url }
        }
    }

    private var hero: some View {
        Text(assessment.title)
            .font(.cuTitle)
            .foregroundStyle(tint.foreground)
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(tint.color)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func fieldRow(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.cuCaption).foregroundStyle(.secondary)
            Text(value).font(.system(size: 15, weight: .medium))
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private var fileRow: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("My work").font(.cuCaption).foregroundStyle(.secondary)
            Button { importing = true } label: {
                HStack {
                    Image(systemName: pickedFile == nil ? "arrow.up.doc" : "doc.fill")
                    Text(pickedFile?.lastPathComponent ?? "Upload file")
                        .lineLimit(1)
                    Spacer()
                    Text(pickedFile == nil ? "" : "Replace")
                        .font(.cuCaption).foregroundStyle(tint.color)
                }
                .padding(14)
                .background(Color(.secondarySystemBackground))
                .foregroundStyle(.primary)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
    }

    private func submit() async {
        guard let userId = try? await auth.currentUserId() else {
            errorMessage = "You must be signed in to submit."
            return
        }
        submitting = true
        errorMessage = nil
        defer { submitting = false }

        var uploadedPath: String?
        if let url = pickedFile {
            do {
                let didAccess = url.startAccessingSecurityScopedResource()
                defer { if didAccess { url.stopAccessingSecurityScopedResource() } }
                let data = try Data(contentsOf: url)
                let filename = url.lastPathComponent
                let path = "\(userId.uuidString)/\(assessment.id.uuidString)/\(filename)"
                uploadedPath = try await storage.upload(
                    bucket: "submissions",
                    path: path,
                    data: data,
                    contentType: url.mimeType
                )
            } catch {
                errorMessage = "Upload failed: \(error.localizedDescription)"
                return
            }
        }

        do {
            try await assessmentService.submitAssignment(
                assessmentId: assessment.id,
                studentId: userId,
                studentName: appState.profile?.username ?? "Student",
                rollNumber: appState.profile?.email ?? "",
                filePath: uploadedPath
            )
            didSubmit = true
            try? await Task.sleep(for: .seconds(0.7))
            dismiss()
        } catch {
            errorMessage = "Submission failed: \(error.localizedDescription)"
        }
    }
}

private extension URL {
    var mimeType: String {
        UTType(filenameExtension: pathExtension)?.preferredMIMEType ?? "application/octet-stream"
    }
}
