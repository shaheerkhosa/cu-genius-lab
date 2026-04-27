import Foundation
import Observation

@MainActor
@Observable
final class ProfileViewModel {
    var profile: Profile?
    var draftUsername = ""
    var isLoading = false
    var isSaving = false
    var errorMessage: String?
    var didSave = false

    private let auth = AuthService()

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let p = try await auth.fetchProfile()
            self.profile = p
            self.draftUsername = p.username
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func save() async {
        guard !draftUsername.isEmpty else { return }
        isSaving = true
        errorMessage = nil
        didSave = false
        defer { isSaving = false }
        do {
            try await auth.updateProfile(username: draftUsername)
            await load()
            didSave = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        try? await auth.signOut()
    }
}

@MainActor
@Observable
final class ChangePasswordViewModel {
    var currentPassword = ""
    var newPassword = ""
    var confirmPassword = ""
    var isSaving = false
    var errorMessage: String?
    var didSave = false

    private let auth = AuthService()

    var canSubmit: Bool {
        !currentPassword.isEmpty
            && newPassword.count >= 6
            && newPassword == confirmPassword
            && newPassword != currentPassword
    }

    func save() async {
        guard !currentPassword.isEmpty else {
            errorMessage = "Enter your current password."
            return
        }
        guard newPassword.count >= 6 else {
            errorMessage = "New password must be at least 6 characters."
            return
        }
        guard newPassword == confirmPassword else {
            errorMessage = "New passwords don't match."
            return
        }
        guard newPassword != currentPassword else {
            errorMessage = "New password must differ from the current one."
            return
        }
        isSaving = true
        errorMessage = nil
        didSave = false
        defer { isSaving = false }
        do {
            try await auth.changePassword(
                currentPassword: currentPassword,
                newPassword: newPassword
            )
            didSave = true
            currentPassword = ""
            newPassword = ""
            confirmPassword = ""
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
