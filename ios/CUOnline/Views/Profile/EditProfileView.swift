import SwiftUI

struct EditProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var vm = ProfileViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Profile Info").font(.cuHeading)

                VStack(alignment: .leading, spacing: 6) {
                    Text("Username").font(.cuCaption).foregroundStyle(.secondary)
                    TextField("Username", text: $vm.draftUsername)
                        .padding(.horizontal, 14).frame(height: 48)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }

                if let profile = vm.profile {
                    readonly("Email", value: profile.email)
                    readonly("Joined", value: profile.createdAt?.formatted(date: .abbreviated, time: .omitted) ?? "—")
                }

                if let error = vm.errorMessage {
                    ErrorBanner(message: error)
                }

                PrimaryButton(title: vm.didSave ? "Saved" : "Save", isLoading: vm.isSaving) {
                    Task {
                        await vm.save()
                        if vm.didSave {
                            try? await Task.sleep(for: .seconds(0.5))
                            dismiss()
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load() }
    }

    private func readonly(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.cuCaption).foregroundStyle(.secondary)
            Text(value)
                .padding(.horizontal, 14).frame(height: 48)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.secondarySystemBackground))
                .foregroundStyle(.secondary)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }
}
