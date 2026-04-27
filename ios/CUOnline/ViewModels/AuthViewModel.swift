import Foundation
import Observation

@MainActor
@Observable
final class AuthViewModel {
    var email = ""
    var password = ""
    var username = ""
    var isLoading = false
    var errorMessage: String?
    var mode: Mode = .signIn

    enum Mode { case signIn, signUp }

    private let auth = AuthService()

    var canSubmit: Bool {
        guard !email.isEmpty, password.count >= 6 else { return false }
        if mode == .signUp, username.isEmpty { return false }
        return true
    }

    func toggleMode() {
        mode = (mode == .signIn) ? .signUp : .signIn
        errorMessage = nil
    }

    func submit() async -> Bool {
        guard canSubmit else { return false }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            switch mode {
            case .signIn:
                _ = try await auth.signIn(email: email, password: password)
            case .signUp:
                _ = try await auth.signUp(email: email, password: password, username: username)
            }
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }
}
