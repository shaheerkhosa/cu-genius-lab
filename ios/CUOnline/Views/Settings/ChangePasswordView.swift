import SwiftUI

struct ChangePasswordView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var vm = ChangePasswordViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Re-enter your current password, then set a new one.")
                    .font(.cuCaption)
                    .foregroundStyle(.secondary)

                SecureField("Current password", text: $vm.currentPassword)
                    .textContentType(.password)
                    .padding(.horizontal, 14).frame(height: 48)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                SecureField("New password", text: $vm.newPassword)
                    .textContentType(.newPassword)
                    .padding(.horizontal, 14).frame(height: 48)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                SecureField("Confirm new password", text: $vm.confirmPassword)
                    .textContentType(.newPassword)
                    .padding(.horizontal, 14).frame(height: 48)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                if let error = vm.errorMessage {
                    ErrorBanner(message: error)
                }

                PrimaryButton(
                    title: vm.didSave ? "Saved" : "Change Password",
                    isLoading: vm.isSaving,
                    disabled: !vm.canSubmit
                ) {
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
        .navigationTitle("Change Password")
        .navigationBarTitleDisplayMode(.inline)
    }
}
